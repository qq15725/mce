import type { Editor } from 'mce'

// 大图导出示例：验证 to('png') 的分块(tiling)导出——当导出尺寸超过实际 GPU drawingBuffer 上限
// （常远低于 MAX_TEXTURE_SIZE，与屏幕/显存相关）时，内核按 drawingBuffer 切块、逐块渲染读回再拼接，
// 应当无缝、无翻转、无错位。加载带方位/坐标标记的画板，自动以高倍率导出触发横纵双向分块，
// 解码后贴缩略图 + 报告供肉眼核对（修复点见 modern-canvas Engine._maxExportPassSize）。

const W = 1600
const H = 1200

function rect(id: string, x: number, y: number, w: number, h: number, color: string): any {
  return { id, style: { left: x, top: y, width: w, height: h, backgroundColor: color }, meta: { inCanvasIs: 'Element2D' } }
}

function band(id: string, y: number, h: number, color: string, label: string, text = '#1a1a2e'): any {
  return {
    id,
    style: { left: 0, top: y, width: W, height: h, backgroundColor: color, fontSize: Math.min(72, h * 0.6), color: text, alignItems: 'center', justifyContent: 'center', textAlign: 'center' },
    text: label,
    meta: { inCanvasIs: 'Element2D' },
  }
}

function buildNodes(): any[] {
  const nodes: any[] = [rect('bg', 0, 0, W, H, '#f4f6fb')]
  // 每 200px 一条坐标横带 + 左绿右蓝竖标，核对行块位置与横向对齐
  for (let y = 0; y < H; y += 200) {
    nodes.push(band(`yb-${y}`, y, 36, (y / 200) % 2 === 0 ? '#dfe6f3' : '#c6d2e8', `y = ${y}`))
    nodes.push(rect(`lr-${y}`, 0, y, 16, 36, '#1db954'))
    nodes.push(rect(`rr-${y}`, W - 16, y, 16, 36, '#2d7ff9'))
  }
  // 顶/中/底醒目标记，核对上下顺序无翻转
  nodes.push(band('top', 0, 80, '#ff2d55', 'TOP ▲ y=0', '#fff'))
  nodes.push(band('mid', H / 2 - 40, 80, '#7b2dff', 'MIDDLE ●', '#fff'))
  nodes.push(band('bot', H - 80, 80, '#0a8f4f', 'BOTTOM ▼ y=end', '#fff'))
  return nodes
}

function report(lines: string[], ok: boolean, thumb: HTMLCanvasElement): void {
  document.getElementById('large-export-report')?.remove()
  const el = document.createElement('div')
  el.id = 'large-export-report'
  el.style.cssText = [
    'position:fixed', 'right:16px', 'bottom:16px', 'width:300px', 'padding:12px',
    'font:12px/1.5 monospace', 'white-space:pre-wrap', 'z-index:99999', 'border-radius:8px',
    `background:${ok ? '#0f3d24' : '#4a0f17'}`, 'color:#e8e8e8', 'box-shadow:0 6px 24px rgba(0,0,0,.4)',
  ].join(';')
  const close = document.createElement('button')
  close.textContent = '×'
  close.style.cssText = 'position:absolute;top:6px;right:8px;background:none;border:none;color:#fff;font-size:16px;cursor:pointer'
  close.onclick = () => el.remove()
  const text = document.createElement('div')
  text.textContent = `${ok ? '✅ PASS' : '❌ FAIL'}\n${lines.join('\n')}`
  thumb.style.cssText = 'display:block;margin-top:8px;width:100%;height:auto;border:1px solid #000;image-rendering:pixelated'
  el.append(close, text, thumb)
  document.body.appendChild(el)
}

async function runExport(editor: Editor, scale: number): Promise<void> {
  const t0 = performance.now()
  let blob: Blob
  try {
    blob = await editor.to('png', { scale })
  }
  catch (e) {
    const c = document.createElement('canvas')
    report([`scale ${scale} → ${W * scale}×${H * scale}`, `导出失败：${String(e)}`, '（尺寸超内存上限时应优雅报错而非卡死/错乱）'], false, c)
    return
  }
  const ms = Math.round(performance.now() - t0)
  const bmp = await createImageBitmap(blob)
  const sizeOk = bmp.width === W * scale && bmp.height === H * scale

  // 缩略图，肉眼核对：TOP 在上 / BOTTOM 在下 / 横带连续无错位 / 左绿右蓝贯穿
  const thumb = document.createElement('canvas')
  const sw = 276
  thumb.width = sw
  thumb.height = Math.round((bmp.height / bmp.width) * sw)
  thumb.getContext('2d')!.drawImage(bmp, 0, 0, thumb.width, thumb.height)

  report([
    `requested : ${W * scale} × ${H * scale}  (scale ${scale})`,
    `output    : ${bmp.width} × ${bmp.height}  (${sizeOk ? 'match' : 'MISMATCH'})`,
    `png size  : ${(blob.size / 1048576).toFixed(2)} MB`,
    `export    : ${ms} ms`,
    '核对缩略图：上下顺序、横带连续、左绿右蓝竖条贯穿。',
  ], sizeOk, thumb)
}

export function loadLargeExportDemo(editor: Editor): void {
  editor.setDoc(buildNodes() as any)
  setTimeout(() => editor.exec('zoomToFit'), 100)
  // 12800×9600 ≈ 1.2 亿像素，必然超过 drawingBuffer → 触发横纵双向分块
  setTimeout(() => void runExport(editor, 8), 500)
}

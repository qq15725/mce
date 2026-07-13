import type { Editor } from 'mce'
import { Flexbox } from 'modern-canvas'
import { box } from './shared'

// 裁剪画板：overflow:hidden，超出边界的内容被裁掉、画板本身不动。
function frame(name: string, style: Record<string, any>): any {
  return {
    name,
    meta: {
      inCanvasIs: 'Element2D',
      inEditorIs: 'Frame',
      inPptIs: 'Slide',
    },
    style: {
      overflow: 'hidden',
      backgroundColor: '#dbeafe', // 浅蓝可见，便于看清画板裁剪边界
      width: 1200,
      height: 1200,
      left: 0,
      top: 0,
      ...style,
    },
  }
}

// 滚动画板：overflow:auto —— 内容超出时裁剪 + 悬停显示引擎渲染的滚动条，滚轮 / 拖滚动条
// 即可滚动画板内部内容（画板本身裁剪住内容、不动位置）。依赖引擎 Node2D.contentOffset。
function scrollFrame(name: string, style: Record<string, any>): any {
  return {
    name,
    meta: { inCanvasIs: 'Element2D', inEditorIs: 'Frame', inPptIs: 'Slide' },
    style: {
      overflow: 'auto',
      backgroundColor: '#f8fafc',
      borderRadius: 16,
      borderColor: '#e2e8f0',
      borderWidth: 2,
      ...style,
    },
  }
}

const CARD = ['#0ea5e9', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#ef4444', '#6366f1', '#eab308', '#f97316', '#06b6d4', '#a855f7']

// 画板（Frame）示例：裁剪画板 + 各方向的滚动画板（含一个 flex 自动布局的滚动画板），
// 一处覆盖画板的裁剪 / 嵌套 / autoNest 拖入拖出 / overflow 纵向·横向·双向滚动 / flex + 滚动。
export async function loadArtboardDemo(editor: Editor): Promise<void> {
  // flex 自动布局需要 yoga 引擎，按需加载（否则 flex 画板不排布）。
  await Flexbox.load()

  const pad = 24
  const gap = 16
  const listW = 460
  const flexW = 360

  // flex 自动布局 + 滚动画板：固定尺寸 + overflow:auto + display:flex(column)，子由 flex 纵向排开、
  // 总高超过画板固定高度 → 溢出 → 纵向滚动。经 setDoc 建树（flex 布局在建树阶段解析）。
  editor.setDoc([{
    ...scrollFrame('flex 滚动（自动布局）', {
      left: listW + 800,
      top: 640,
      width: flexW,
      height: 560,
      display: 'flex',
      flexDirection: 'column',
      gap,
      padding: pad,
      alignItems: 'stretch',
    }),
    children: Array.from({ length: 10 }, (_, i) => ({
      id: `fs-flex-${i}`,
      style: {
        width: flexW - pad * 2,
        height: 120,
        flexShrink: 0,
        borderRadius: 10,
        fontSize: 16,
        color: '#ffffff',
        textAlign: 'center',
        verticalAlign: 'middle',
        lineHeight: 120,
      },
      fill: CARD[i % CARD.length],
      text: `行 ${i + 1}`,
      meta: { inCanvasIs: 'Element2D' },
    })),
  }])

  // ── 裁剪画板 ──────────────────────────────────────────────
  // 画板 A（原点、active 选中）：内含越过右/下边界的溢出块，验证 overflow:hidden 裁剪。
  const frameA = editor.addElement(frame('画板 A（裁剪）', { left: 0, top: 0, width: 600, height: 400 }), { active: true })
  editor.addElement(box({ id: 'ab-a1', label: 'A 内 1', color: '#3b82f6', left: 60, top: 60, width: 200, height: 100 }), { parent: frameA })
  editor.addElement(box({ id: 'ab-a2', label: 'A 内 2', color: '#22c55e', left: 320, top: 220, width: 200, height: 100 }), { parent: frameA })
  editor.addElement(box({ id: 'ab-a-overflow', label: '溢出A', color: '#ef4444', left: 480, top: 300, width: 240, height: 240 }), { parent: frameA })

  // 嵌套画板：画板 B 内放一个内层画板，再放一个「在内层之外、且更晚渲染」的兄弟块，
  // 验证 scissor pop 恢复上层 rect（否则兄弟块会被错裁到内层画板范围 → 消失）。
  const frameB = editor.addElement(frame('画板 B（嵌套）', { left: 760, top: 0, width: 600, height: 400 }))
  const inner = editor.addElement(frame('内层画板', { left: 40, top: 40, width: 200, height: 150 }), { parent: frameB })
  editor.addElement(box({ id: 'ab-inner', label: '内层内容', color: '#f59e0b', left: 20, top: 20, width: 160, height: 80 }), { parent: inner })
  editor.addElement(box({ id: 'ab-b-sibling', label: '内层之外', color: '#8b5cf6', left: 320, top: 240, width: 220, height: 120 }), { parent: frameB })

  // 游离方块（拖入/拖出画板测 autoNest）。
  editor.addElement(box({ id: 'ab-loose', label: '拖我进画板', color: '#ec4899', left: 300, top: 460, width: 200, height: 100 }))

  // ── 滚动画板 ──────────────────────────────────────────────
  // 纵向滚动：任务列表 —— 12 张卡片纵向排列，远超画板高度 → 竖向滚动。
  const cardH = 96
  const frameList = editor.addElement(scrollFrame('任务列表（纵向滚动）', { left: 0, top: 640, width: listW, height: 560 }))
  for (let i = 0; i < 12; i++) {
    editor.addElement(
      box({ id: `fs-task-${i}`, label: `任务 ${i + 1}`, color: CARD[i % CARD.length], left: pad, top: pad + i * (cardH + gap), width: listW - pad * 2, height: cardH }),
      { parent: frameList },
    )
  }

  // 横向滚动：图库 —— 一排缩略图超出画板宽度 → 横向滚动（shift+滚轮 / 底部滚动条）。
  const galleryH = 260
  const thumb = 200
  const frameGallery = editor.addElement(scrollFrame('横向图库（横向滚动）', { left: listW + 120, top: 640, width: 640, height: galleryH }))
  for (let i = 0; i < 8; i++) {
    editor.addElement(
      box({ id: `fs-thumb-${i}`, label: `图 ${i + 1}`, color: CARD[(i + 3) % CARD.length], left: pad + i * (thumb + gap), top: pad, width: thumb, height: galleryH - pad * 2 }),
      { parent: frameGallery },
    )
  }

  // 双向滚动：网格既超宽又超高，两条滚动条同时出现。
  const frameGrid = editor.addElement(scrollFrame('双向网格（双向滚动）', { left: listW + 120, top: galleryH + 760, width: 500, height: 320 }))
  const cell = 150
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 5; c++) {
      editor.addElement(
        box({ id: `fs-cell-${r}-${c}`, label: `${r + 1}-${c + 1}`, color: CARD[(r * 5 + c) % CARD.length], left: pad + c * (cell + gap), top: pad + r * (cell + gap), width: cell, height: cell }),
        { parent: frameGrid },
      )
    }
  }

  // flex 滚动画板已在 setDoc 阶段建立（见函数顶部 flexScrollNode）。

  setTimeout(() => editor.exec('zoomToFit'), 100)
}

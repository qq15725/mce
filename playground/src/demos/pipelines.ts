import type { Editor, ImagePipeline } from 'mce'

// 图片处理管线（foreground.imagePipelines）示例：演示「外部注册自定义管线 + 数据只记管线名/参数」的完整闭环。
// - 管线是 image → image 的黑盒函数，经 editor.registerImagePipeline 注册；
// - 元素数据只写 imagePipelines: [{ name, params }]，渲染端按需把图片烘焙到运行时纹理；
// - 多个管线按数组顺序链式作用（如「灰度 → 染色」）。
// 这些管线纯像素操作（直接改 RGBA），不依赖任何业务包；bige 的「图片样式」则走 @mce/bigesj 的内置 imageEffect 管线。

/** #rrggbb → [r,g,b] */
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [
    Number.parseInt(h.slice(0, 2), 16) || 0,
    Number.parseInt(h.slice(2, 4), 16) || 0,
    Number.parseInt(h.slice(4, 6), 16) || 0,
  ]
}

const grayscale: ImagePipeline = {
  name: 'demo:grayscale',
  process: (img) => {
    const d = img.data
    for (let i = 0; i < d.length; i += 4) {
      const g = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]
      d[i] = d[i + 1] = d[i + 2] = g
    }
    return img
  },
}

const invert: ImagePipeline = {
  name: 'demo:invert',
  process: (img) => {
    const d = img.data
    for (let i = 0; i < d.length; i += 4) {
      d[i] = 255 - d[i]
      d[i + 1] = 255 - d[i + 1]
      d[i + 2] = 255 - d[i + 2]
    }
    return img
  },
}

const tint: ImagePipeline = {
  name: 'demo:tint',
  process: (img, params) => {
    const [tr, tg, tb] = hexToRgb(params?.color ?? '#ff0066')
    const k = params?.strength ?? 0.5
    const d = img.data
    for (let i = 0; i < d.length; i += 4) {
      d[i] = d[i] * (1 - k) + tr * k
      d[i + 1] = d[i + 1] * (1 - k) + tg * k
      d[i + 2] = d[i + 2] * (1 - k) + tb * k
    }
    return img
  },
}

/** 供 demo 与 App.vue 动态测试复用的自定义管线集合。 */
export const demoImagePipelines: ImagePipeline[] = [grayscale, invert, tint]

export function loadPipelinesDemo(editor: Editor): void {
  // 注册自定义管线（同名覆盖，重复进入示例安全）。
  demoImagePipelines.forEach(p => editor.registerImagePipeline(p))

  const cases: { label: string, imagePipelines?: { name: string, params?: Record<string, any> }[] }[] = [
    { label: '原图' },
    { label: '灰度', imagePipelines: [{ name: 'demo:grayscale' }] },
    { label: '反色', imagePipelines: [{ name: 'demo:invert' }] },
    { label: '染色', imagePipelines: [{ name: 'demo:tint', params: { color: '#ff0066', strength: 0.5 } }] },
    // 链式：先灰度再染色，按数组顺序依次作用
    { label: '灰度+染色（链式）', imagePipelines: [{ name: 'demo:grayscale' }, { name: 'demo:tint', params: { color: '#00aaff', strength: 0.45 } }] },
  ]

  const COLS = 3
  const CELL_W = 240
  const CELL_H = 250
  const TILE = 200
  const nodes: any[] = []
  cases.forEach((c, i) => {
    const x = (i % COLS) * CELL_W
    const y = Math.floor(i / COLS) * CELL_H
    nodes.push({
      id: `pl-${i}`,
      style: { left: x, top: y, width: TILE, height: TILE, backgroundColor: '#ffffff' },
      foreground: { image: '/example.jpg', fillWithShape: true, ...(c.imagePipelines ? { imagePipelines: c.imagePipelines } : {}) },
      meta: { inCanvasIs: 'Element2D', inPptIs: 'Picture' },
    })
    nodes.push({
      id: `pl-lbl-${i}`,
      style: { left: x, top: y + TILE + 6, width: TILE, height: 24, fontSize: 14, color: '#1a1a2e', textAlign: 'center' },
      text: c.label,
      meta: { inCanvasIs: 'Element2D' },
    })
  })
  editor.setDoc(nodes as any)
  setTimeout(() => editor.exec('zoomToFit'), 100)
}

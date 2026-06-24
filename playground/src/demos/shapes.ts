import type { Editor } from 'mce'

// 各种几何形状：shape.paths 的 path data 会被缩放铺满元素 box（坐标只需相对正确）。
const SHAPES: { label: string, data: string, color: string }[] = [
  { label: '矩形', data: 'M0 0H24V24H0Z', color: '#ef4444' },
  { label: '圆形', data: 'M12 0A12 12 0 1 1 12 24A12 12 0 1 1 12 0Z', color: '#f59e0b' },
  { label: '三角', data: 'M12 0L24 24H0Z', color: '#22c55e' },
  { label: '菱形', data: 'M12 0L24 12L12 24L0 12Z', color: '#06b6d4' },
  { label: '五边形', data: 'M12 0L24 9L19.5 24H4.5L0 9Z', color: '#3b82f6' },
  { label: '六边形', data: 'M6 0H18L24 12L18 24H6L0 12Z', color: '#8b5cf6' },
  { label: '五角星', data: 'M12 0L15 8.5H24L16.5 14L19.5 24L12 18L4.5 24L7.5 14L0 8.5H9Z', color: '#ec4899' },
  { label: '箭头', data: 'M0 8H16V0L24 12L16 24V16H0Z', color: '#14b8a6' },
]

export function loadShapesDemo(editor: Editor): void {
  const COLS = 4
  const CELL = 180
  const SIZE = 130
  const nodes: any[] = []
  SHAPES.forEach((s, i) => {
    const x = (i % COLS) * CELL
    const y = Math.floor(i / COLS) * CELL
    nodes.push({
      id: `shape-${i}`,
      style: { left: x, top: y, width: SIZE, height: SIZE },
      shape: [{ data: s.data }],
      fill: s.color,
      outline: { color: '#0f172a', width: 2 },
      meta: { inPptIs: 'Shape', inCanvasIs: 'Element2D' },
    })
    nodes.push({
      id: `shape-lbl-${i}`,
      style: { left: x, top: y + SIZE + 4, width: SIZE, height: 22, fontSize: 14, color: '#1a1a2e', textAlign: 'center' },
      text: s.label,
      meta: { inCanvasIs: 'Element2D' },
    })
  })
  editor.setDoc(nodes as any)
  setTimeout(() => editor.exec('zoomToFit'), 100)
}

import type { Editor } from 'mce'

// 填充 / 描边 / 阴影 / 透明度：纯色、线性渐变、径向渐变、图片填充、虚线描边、外阴影等。
export function loadFillStrokeDemo(editor: Editor): void {
  const cards: { label: string, props: any }[] = [
    { label: '纯色填充', props: { fill: '#3b82f6' } },
    { label: '线性渐变', props: { fill: { linearGradient: { angle: 45, stops: [{ offset: 0, color: '#7c3aed' }, { offset: 1, color: '#ec4899' }] } } } },
    { label: '径向渐变', props: { fill: { radialGradient: { stops: [{ offset: 0, color: '#fde047' }, { offset: 1, color: '#ea580c' }] } } } },
    { label: '图片填充', props: { fill: { image: '/example.jpg' } } },
    { label: '虚线描边', props: { fill: '#ffffff', outline: { color: '#0ea5e9', width: 3, style: 'dashed' } } },
    { label: '粗描边+阴影', props: { fill: '#22c55e', outline: { color: '#064e3b', width: 5 }, shadow: { color: '#00000066', blur: 18, offsetX: 8, offsetY: 10 } } },
    { label: '外阴影', props: { fill: '#f59e0b', shadow: { color: '#00000055', blur: 24, offsetX: 0, offsetY: 12 } } },
    { label: '半透明', props: { fill: '#ef4444', style: { opacity: 0.45 } } },
  ]
  const COLS = 4
  const CELL_W = 220
  const CELL_H = 200
  const TILE = 170
  const nodes: any[] = []
  cards.forEach((c, i) => {
    const x = (i % COLS) * CELL_W
    const y = Math.floor(i / COLS) * CELL_H
    const { style: extraStyle, ...rest } = c.props
    nodes.push({
      id: `fs-${i}`,
      style: { left: x, top: y, width: TILE, height: TILE - 30, borderRadius: 16, ...extraStyle },
      ...rest,
      meta: { inCanvasIs: 'Element2D' },
    })
    nodes.push({
      id: `fs-lbl-${i}`,
      style: { left: x, top: y + TILE - 24, width: TILE, height: 22, fontSize: 14, color: '#1a1a2e', textAlign: 'center' },
      text: c.label,
      meta: { inCanvasIs: 'Element2D' },
    })
  })
  editor.setDoc(nodes as any)
  setTimeout(() => editor.exec('zoomToFit'), 100)
}

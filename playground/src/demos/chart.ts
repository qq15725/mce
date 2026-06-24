import type { Editor } from 'mce'
import { createChartElement } from '@mce/chart'

// 图表：复用 mce 内建 chart 元素（柱状 / 折线 / 饼图 / 条形）。需要可选依赖 echarts。
export function loadChartDemo(editor: Editor): void {
  const specs: { type: any, x: number, y: number, opts?: any }[] = [
    { type: 'column', x: 0, y: 0 },
    { type: 'line', x: 420, y: 0 },
    { type: 'pie', x: 0, y: 300, opts: { categories: ['A', 'B', 'C', 'D'], series: [{ name: '占比', values: [35, 25, 22, 18] }] } },
    { type: 'bar', x: 420, y: 300 },
  ]
  const nodes = specs.map((s, i) => {
    const el: any = createChartElement(s.type, { width: 380, height: 260, ...s.opts })
    el.id = `chart-${i}`
    el.style = { ...el.style, left: s.x, top: s.y }
    return el
  })
  editor.setDoc(nodes as any)
  setTimeout(() => editor.exec('zoomToFit'), 150)
}

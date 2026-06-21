import type { Chart, ChartType, Element } from 'modern-idoc'

export interface CreateChartElementOptions {
  width?: number
  height?: number
  categories?: string[]
  series?: Chart['series']
}

/** A chart backed by the native `chart` element property (column/line/pie/…). */
export function createChartElement(type: ChartType = 'column', options: CreateChartElementOptions = {}): Element {
  const {
    width = 360,
    height = 240,
    categories = ['一月', '二月', '三月', '四月', '五月'],
    series = [{ name: '系列 1', values: [40, 70, 55, 90, 60] }],
  } = options
  return {
    style: { width, height },
    chart: {
      type,
      categories,
      series,
      legend: 'bottom',
    },
    meta: { inPptIs: 'Shape', inCanvasIs: 'Element2D', inEditorIs: 'Chart' },
  }
}

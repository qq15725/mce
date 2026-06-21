import type { Element2D } from 'modern-canvas'
import type { ChartType } from 'modern-idoc'
import { definePlugin } from 'mce'
import { createChartElement } from './create'

declare global {
  namespace Mce {
    interface Tools {
      chartBar: []
      chartLine: []
      chartPie: []
    }

    interface ChartLegendOptions {
      legend?: 'top' | 'bottom' | 'left' | 'right' | 'none'
      title?: string
    }

    interface ChartData {
      categories?: string[]
      series?: { name?: string, values: number[] }[]
    }

    interface Commands {
      getChart: (node?: Element2D) => any
      setChartType: (type: ChartType, node?: Element2D) => void
      /** 更新图表数据（categories / series），未给的字段保留。 */
      setChartData: (data: ChartData, node?: Element2D) => void
      /** 更新图例位置 / 标题等展示项。 */
      setChartOptions: (options: ChartLegendOptions, node?: Element2D) => void
    }
  }
}

export function plugin() {
  return definePlugin((editor) => {
    const {
      elementSelection,
      addElement,
      activateTool,
      registerToolbeltShapeItem,
    } = editor

    // 工具栏「形状」下拉追加图表工具。
    registerToolbeltShapeItem('chartBar')
    registerToolbeltShapeItem('chartLine')
    registerToolbeltShapeItem('chartPie')

    function getChart(node?: Element2D): any {
      const el = (node ?? elementSelection.value[0]) as any
      return el?.chart?.toJSON?.() ?? el?.chart
    }

    function patch(patchData: Record<string, any>, node?: Element2D): void {
      const el = (node ?? elementSelection.value[0]) as any
      if (!el?.chart) {
        return
      }
      el.chart = { ...(el.chart.toJSON?.() ?? {}), ...patchData }
      el.requestDraw?.()
    }

    function setChartType(type: ChartType, node?: Element2D): void {
      patch({ type }, node)
    }

    function setChartData(data: Mce.ChartData, node?: Element2D): void {
      const next: Record<string, any> = {}
      if (data.categories !== undefined) {
        next.categories = data.categories
      }
      if (data.series !== undefined) {
        next.series = data.series
      }
      patch(next, node)
    }

    function setChartOptions(options: Mce.ChartLegendOptions, node?: Element2D): void {
      const next: Record<string, any> = {}
      if (options.legend !== undefined) {
        next.legend = options.legend
      }
      if (options.title !== undefined) {
        next.title = options.title
      }
      patch(next, node)
    }

    return {
      name: 'mce:chart',
      commands: [
        { command: 'getChart', handle: getChart },
        { command: 'setChartType', handle: setChartType },
        { command: 'setChartData', handle: setChartData },
        { command: 'setChartOptions', handle: setChartOptions },
      ],
      tools: [
        {
          name: 'chartBar',
          handle: (start) => {
            addElement(createChartElement('column'), { position: start, active: true })
            return { end: () => activateTool(undefined) }
          },
        },
        {
          name: 'chartLine',
          handle: (start) => {
            addElement(createChartElement('line'), { position: start, active: true })
            return { end: () => activateTool(undefined) }
          },
        },
        {
          name: 'chartPie',
          handle: (start) => {
            addElement(createChartElement('pie'), { position: start, active: true })
            return { end: () => activateTool(undefined) }
          },
        },
      ],
      messages: {
        en: {
          chartBar: 'Bar Chart',
          chartLine: 'Line Chart',
          chartPie: 'Pie Chart',
        },
        zhHans: {
          chartBar: '柱状图',
          chartLine: '折线图',
          chartPie: '饼图',
        },
      },
    }
  })
}

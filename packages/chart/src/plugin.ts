import type { Element2D } from 'modern-canvas'
import type { ChartType } from 'modern-idoc'
import { definePlugin, outlineIcon } from 'mce'
import ChartEditor from './ChartEditor.vue'
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
      registerIcon,
      registerEnterHandler,
      registerEditingState,
    } = editor

    // 随插件携带图标（核心图标集不再硬编码图表图标）。
    // Lucide chart-column / chart-line / chart-pie（outline 风格）。
    registerIcon('chartBar', outlineIcon('M3 3v16a2 2 0 0 0 2 2h16', 'M18 17V9', 'M13 17V5', 'M8 17v-3'))
    registerIcon('chartLine', outlineIcon('M3 3v16a2 2 0 0 0 2 2h16', 'm19 9-5 5-4-4-3 3'))
    registerIcon('chartPie', outlineIcon('M21 12c.552 0 1.005-.449.95-.998a10 10 0 0 0-8.953-8.951c-.55-.055-.998.398-.998.95v8a1 1 0 0 0 1 1z', 'M21.21 15.89A10 10 0 1 1 8 2.83'))

    // 工具栏「形状」下拉追加图表工具。
    registerToolbeltShapeItem('chartBar')
    registerToolbeltShapeItem('chartLine')
    registerToolbeltShapeItem('chartPie')

    // 双击 / Enter 图表元素 → 打开数据编辑弹窗（ChartEditor 监听该状态）。
    registerEnterHandler((el, ed) => {
      if ((el as any).chart?.isValid?.()) {
        ed.state.value = 'chartEditing'
        return true
      }
      return false
    })
    // 内容编辑态：弹窗期间隐藏选择框 / 浮动条、抑制快捷键。
    registerEditingState('chartEditing')

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
      components: [
        { type: 'overlay', component: ChartEditor },
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

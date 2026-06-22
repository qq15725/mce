import type { Chart } from 'modern-idoc'
import { clearUndef } from 'modern-idoc'

/** echarts 系列类型 → mce 归一化图表类型（bar 按分类轴方向区分 column / bar）。 */
function mapChartType(option: any): string {
  const seriesType = option?.series?.[0]?.type
  switch (seriesType) {
    case 'bar':
      // 分类轴在 y 上 → 横向条形（mce bar）；否则纵向柱状（mce column）。
      return option?.yAxis?.type === 'category' ? 'bar' : 'column'
    case 'line':
      return option?.series?.[0]?.areaStyle ? 'area' : 'line'
    case 'pie':
      return 'pie'
    case 'scatter':
      return 'scatter'
    case 'radar':
      return 'radar'
    default:
      return 'column'
  }
}

/**
 * bigesj echart（raw echarts option）→ mce 归一化 `chart` prop。
 *
 * mce 的 chart 是归一化模型（{type, categories, series}），不吃 raw echarts option，故在此解析：
 * - 优先 `dataset.source`（[表头, ...数据行]，首列为分类、其余每列一个系列）；
 * - 兜底 `series[].data`（[{name,value}] 或 [number]）。
 */
export function convertChart(option: any): Chart {
  const colors: string[] = Array.isArray(option?.color) ? option.color : []
  const type = mapChartType(option)
  let categories: string[] = []
  let series: { name?: string, values: number[], color?: string }[] = []

  const source = option?.dataset?.source
  if (Array.isArray(source) && source.length > 1 && Array.isArray(source[0])) {
    const header = source[0]
    const rows = source.slice(1)
    categories = rows.map((r: any[]) => String(r[0] ?? ''))
    for (let c = 1; c < header.length; c++) {
      series.push({
        name: header[c] != null ? String(header[c]) : undefined,
        values: rows.map((r: any[]) => Number(r[c]) || 0),
        color: colors[c - 1],
      })
    }
  }
  else if (Array.isArray(option?.series)) {
    const first: any[] = option.series[0]?.data ?? []
    categories = first.map((d: any, i: number) => String(d?.name ?? d?.[0] ?? i + 1))
    series = option.series.map((s: any, i: number) => ({
      name: s.name,
      values: (s.data ?? []).map((d: any) => Number(d?.value ?? d?.[1] ?? d) || 0),
      color: colors[i],
    }))
  }

  return clearUndef({
    enabled: true,
    type,
    categories,
    series,
    title: option?.title?.text || undefined,
    legend: option?.legend?.show === false ? false : 'bottom',
  }) as Chart
}

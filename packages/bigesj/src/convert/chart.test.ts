import { describe, expect, it } from 'vitest'
import { convertChart } from './chart'

describe('convertChart', () => {
  it('dataset.source 柱状图 → 归一化 column', () => {
    const option = {
      color: ['#4992ff'],
      title: { text: '基础柱状图', top: 0, bottom: 'auto' },
      xAxis: { type: 'category' },
      yAxis: { type: 'value' },
      series: [{ type: 'bar' }],
      dataset: {
        source: [
          ['日期', '产量'],
          ['Mon', 820],
          ['Tue', 932],
          ['Wed', 901],
          ['Thu', 1290],
          ['Fri', 1330],
          ['Sat', 1320],
          ['Sun', 934],
        ],
      },
    }
    const chart: any = convertChart(option)
    expect(chart.type).toBe('column')
    expect(chart.title).toBe('基础柱状图')
    expect(chart.categories).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])
    expect(chart.series).toEqual([
      { name: '产量', values: [820, 932, 901, 1290, 1330, 1320, 934], color: '#4992ff' },
    ])
  })

  it('分类轴在 y 上 → 横向 bar', () => {
    const chart: any = convertChart({
      xAxis: { type: 'value' },
      yAxis: { type: 'category' },
      series: [{ type: 'bar' }],
      dataset: { source: [['x', 'y'], ['A', 1]] },
    })
    expect(chart.type).toBe('bar')
  })

  it('line / pie 类型映射', () => {
    expect((convertChart({ series: [{ type: 'line' }], dataset: { source: [['a', 'b'], ['x', 1]] } }) as any).type).toBe('line')
    expect((convertChart({ series: [{ type: 'pie' }], dataset: { source: [['a', 'b'], ['x', 1]] } }) as any).type).toBe('pie')
  })

  it('series[].data 兜底（无 dataset）', () => {
    const chart: any = convertChart({
      series: [{ type: 'bar', data: [{ name: 'A', value: 10 }, { name: 'B', value: 20 }] }],
    })
    expect(chart.categories).toEqual(['A', 'B'])
    expect(chart.series[0].values).toEqual([10, 20])
  })
})

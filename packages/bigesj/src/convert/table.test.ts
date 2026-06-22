import { describe, expect, it } from 'vitest'
import { convertTable } from './table'

const sample = {
  colWidths: [165, 165, 165, 165],
  rowHeights: [48, 48, 48, 48, 48],
  data: [
    [
      { text: '序号', style: { fontFamily: 'SourceHanSansCN-Normal' }, id: 1 },
      { text: '电影名称', style: { fontFamily: 'SourceHanSansCN-Normal' }, id: 2 },
      { text: '票房（亿元）', style: { fontFamily: 'SourceHanSansCN-Normal' }, id: 3 },
      { text: '上映日期', style: { fontFamily: 'SourceHanSansCN-Normal' }, id: 4 },
    ],
    [
      { text: '1', style: {}, id: 5 },
      { text: '八佰', style: {}, id: 6 },
      { text: '31.09', style: {}, id: 7 },
      { text: '2020/08/01', style: {}, id: 8 },
    ],
  ],
  style: {
    'td': 'border: 3px solid #ffffff; padding: 10px; color: #2b2a2e; text-align: center; font-size: 14px; background-color: #dce6f3;',
    'tr:first-child td': 'font-weight: bold; font-size: 16px; color: #ffffff;',
    'tr:first-child td:nth-child(odd)': 'background-color: #5f88c1;border-top: none;',
    'tr:first-child td:nth-child(even)': 'background-color: #8babd7;border-top: none;',
  },
}

describe('convertTable', () => {
  it('列宽 / 行高 / 单元格内容与样式', () => {
    const table: any = convertTable(sample)

    expect(table.columns).toEqual([{ width: 165 }, { width: 165 }, { width: 165 }, { width: 165 }])
    expect(table.rows).toHaveLength(5)
    expect(table.rows[0]).toEqual({ height: 48 })
    expect(table.cells).toHaveLength(8) // 2 行 × 4 列

    // 单元格文字
    const c00 = table.cells.find((c: any) => c.row === 0 && c.col === 0)
    expect(c00.children[0].text.content[0].fragments[0].content).toBe('序号')
    const c11 = table.cells.find((c: any) => c.row === 1 && c.col === 1)
    expect(c11.children[0].text.content[0].fragments[0].content).toBe('八佰')
  })

  it('表头加粗 + 白字 + 奇偶列底色，正文 td 样式', () => {
    const table: any = convertTable(sample)
    const header0 = table.cells.find((c: any) => c.row === 0 && c.col === 0)
    const header1 = table.cells.find((c: any) => c.row === 0 && c.col === 1)
    const body = table.cells.find((c: any) => c.row === 1 && c.col === 0)

    // 表头：tr:first-child td 覆盖 → 加粗、16px、白字
    expect(header0.children[0].style.fontWeight).toBe(700)
    expect(header0.children[0].style.fontSize).toBe(16)
    expect(header0.children[0].style.color).toBe('#ffffff')
    // 表头奇偶列底色（col0=奇/odd, col1=偶/even）
    expect(header0.background).toBe('#5f88c1')
    expect(header1.background).toBe('#8babd7')

    // 正文：td 基础样式 → 14px、深色、居中、浅蓝底
    expect(body.children[0].style.fontWeight).toBe(400)
    expect(body.children[0].style.fontSize).toBe(14)
    expect(body.children[0].style.color).toBe('#2b2a2e')
    expect(body.children[0].style.textAlign).toBe('center')
    expect(body.background).toBe('#dce6f3')

    // 边框从 td 的 border 简写解析（3px #ffffff）
    expect(body.style.borderWidth).toBe(3)
    expect(body.style.borderColor).toBe('#ffffff')

    // fontFamily 透传
    expect(header0.children[0].style.fontFamily).toBe('SourceHanSansCN-Normal')
  })

  it('userStyle 优先于 style（用户自定义覆盖主题）', () => {
    const table: any = convertTable({
      ...sample,
      userStyle: { td: 'color: #ff0000; font-size: 20px; background-color: #00ff00;' },
    })
    const body = table.cells.find((c: any) => c.row === 1 && c.col === 0)
    expect(body.children[0].style.color).toBe('#ff0000')
    expect(body.children[0].style.fontSize).toBe(20)
    expect(body.background).toBe('#00ff00')
  })
})

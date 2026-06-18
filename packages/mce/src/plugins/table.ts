import type { Element2D } from 'modern-canvas'
import VueTableEditor from '../components/TableEditor.vue'
import { definePlugin } from '../plugin'

declare global {
  namespace Mce {
    interface Commands {
      /** 设置单元格 (row,col) 的样式（边框 / 对齐等，合并）。 */
      setTableCellStyle: (row: number, col: number, style: Record<string, any>, node?: Element2D) => void
      /** 设置单元格 (row,col) 的背景。 */
      setTableCellBackground: (row: number, col: number, background: any, node?: Element2D) => void
    }
  }
}

export default definePlugin((editor) => {
  const { elementSelection } = editor

  /** 改写某单元格并整体回写 table 以触发重渲。 */
  function patchCell(row: number, col: number, mutate: (cell: any) => void, node?: Element2D): void {
    const el = (node ?? elementSelection.value[0]) as any
    if (!el?.table) {
      return
    }
    const data = el.table.toJSON?.() ?? el.table
    const cell = data.cells?.find((c: any) => c.row === row && c.col === col)
    if (!cell) {
      return
    }
    mutate(cell)
    el.table = data
    el.requestDraw?.()
  }

  function setTableCellStyle(row: number, col: number, style: Record<string, any>, node?: Element2D): void {
    patchCell(row, col, cell => (cell.style = { ...(cell.style ?? {}), ...style }), node)
  }

  function setTableCellBackground(row: number, col: number, background: any, node?: Element2D): void {
    patchCell(row, col, cell => (cell.background = background), node)
  }

  return {
    name: 'mce:table',
    commands: [
      { command: 'setTableCellStyle', handle: setTableCellStyle },
      { command: 'setTableCellBackground', handle: setTableCellBackground },
    ],
    messages: {
      en: {
        'table:insertRowAbove': 'Insert row above',
        'table:insertRowBelow': 'Insert row below',
        'table:insertColLeft': 'Insert column left',
        'table:insertColRight': 'Insert column right',
        'table:deleteRow': 'Delete rows',
        'table:deleteCol': 'Delete columns',
        'table:mergeCells': 'Merge cells',
        'table:splitCell': 'Split cell',
      },
      zhHans: {
        'table:insertRowAbove': '上方插入行',
        'table:insertRowBelow': '下方插入行',
        'table:insertColLeft': '左侧插入列',
        'table:insertColRight': '右侧插入列',
        'table:deleteRow': '删除行',
        'table:deleteCol': '删除列',
        'table:mergeCells': '合并单元格',
        'table:splitCell': '拆分单元格',
      },
    },
    components: [
      { type: 'overlay', component: VueTableEditor },
    ],
  }
})

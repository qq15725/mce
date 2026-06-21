import type { Element2D } from 'modern-canvas'
import VueTableEditor from '../components/TableEditor.vue'
import { definePlugin } from '../plugin'
import { createTableElement } from '../utils'

declare global {
  namespace Mce {
    interface Tools {
      table: []
    }

    interface Commands {
      /** 设置单元格 (row,col) 的样式（边框 / 对齐等，合并）。 */
      setTableCellStyle: (row: number, col: number, style: Record<string, any>, node?: Element2D) => void
      /** 设置单元格 (row,col) 的背景。 */
      setTableCellBackground: (row: number, col: number, background: any, node?: Element2D) => void
    }
  }
}

export default definePlugin((editor) => {
  const {
    elementSelection,
    isElement,
    addElement,
    activateTool,
    registerSelectionRedirect,
    registerResizeOverride,
    registerEnterHandler,
    registerEditingState,
    registerToolbeltShapeItem,
  } = editor

  // —— 核心扩展点注册：把表格相关的特例行为从核心解耦到本插件 ——

  // 选择重定向：单元格是表格内部 back 层的 Element2D，命中单元格时重定向到所属表格，
  // 单元格永不可单独选中。
  registerSelectionRedirect((node) => {
    return node.findAncestor<Element2D>(
      n => isElement(n) && Boolean((n as Element2D).table?.isValid?.()),
    ) ?? node
  })

  // 缩放覆盖：表格尺寸由行列网格决定（Element2DTable 强制元素为 gridWidth×gridHeight），
  // 故缩放网格与各单元格文字，而非整体盒子，再写回。
  registerResizeOverride((el, { scaleX, scaleY, newWidth, newHeight, options }) => {
    if (!el.table.isValid()) {
      return false
    }
    const scaleFont = options.textFontSizeToFit ? scaleX : 1
    const columns = el.table.columns.map(c => ({ ...c, width: (c.width || 0) * scaleX }))
    const rows = el.table.rows.map(r => ({ ...r, height: (r.height || 0) * scaleY }))
    const cells = (JSON.parse(JSON.stringify(el.table.cells)) as any[]).map((cell) => {
      const cs = cell.children?.[0]?.style
      if (cs) {
        if (cs.width)
          cs.width *= scaleX
        if (cs.height)
          cs.height *= scaleY
        if (scaleFont !== 1 && cs.fontSize)
          cs.fontSize *= scaleFont
      }
      return cell
    })
    el.style.width = newWidth
    el.style.height = newHeight
    el.table.setProperties({ columns, rows, cells })
    return true
  })

  // 进入编辑：双击 / Enter 选中表格 → 进入表格编辑态。
  registerEnterHandler((el, ed) => {
    if (el.table.isValid()) {
      ed.state.value = 'tableEditing'
      return true
    }
    return false
  })

  // 内容编辑态：处于 tableEditing 时隐藏选择框 / 浮动条、抑制快捷键。
  registerEditingState('tableEditing')

  // 工具栏「形状」下拉追加「表格」。
  registerToolbeltShapeItem('table')

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
    tools: [
      {
        // 点击插入默认示例表格（固定尺寸，不走拖拽缩放）。
        name: 'table',
        handle: (start) => {
          addElement(createTableElement(), { position: start, active: true })
          return { end: () => activateTool(undefined) }
        },
      },
    ],
    messages: {
      en: {
        'table': 'Table',
        'tableEditing': 'Editing table',
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
        'table': '表格',
        'tableEditing': '编辑表格...',
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

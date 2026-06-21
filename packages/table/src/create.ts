import type { Element, TableCellObject } from 'modern-idoc'
import { normalizeTextContent } from 'modern-idoc'
import { CELL_BACKGROUND, CELL_BORDER_STYLE, defaultTextStyle } from './table'

export interface CreateTableElementOptions {
  width?: number
  height?: number
}

/** A grid table backed by the native `table` element property; first row is a header. */
export function createTableElement(rows = 3, cols = 3, options: CreateTableElementOptions = {}): Element {
  const { width = 360, height = 160 } = options
  const colWidth = width / cols
  const rowHeight = height / rows
  const cells: TableCellObject[] = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      cells.push({
        row: r,
        col: c,
        // White fill + a 1px border so the canvas renders a solid, lined table.
        background: CELL_BACKGROUND,
        style: { ...CELL_BORDER_STYLE },
        children: [
          {
            // Sizing the child to the cell lets `verticalAlign` center the text.
            style: { ...defaultTextStyle(r === 0), width: colWidth, height: rowHeight },
            text: { content: normalizeTextContent(r === 0 ? `列 ${c + 1}` : '') },
            meta: { inCanvasIs: 'Element2D' },
          },
        ],
      })
    }
  }
  return {
    style: { width, height },
    table: {
      columns: Array.from({ length: cols }, () => ({ width: colWidth })),
      rows: Array.from({ length: rows }, () => ({ height: rowHeight })),
      cells,
    },
    meta: { inPptIs: 'Shape', inCanvasIs: 'Element2D', inEditorIs: 'Table' },
  }
}

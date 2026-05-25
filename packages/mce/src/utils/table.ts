import type { NormalizedTable, Table } from 'modern-idoc'
import { normalizeTextContent, textContentToString } from 'modern-idoc'

/**
 * A mutable, editor-side mirror of an idoc table. It intentionally keeps the
 * same shape as {@link NormalizedTable} (flat `cells[]` keyed by `row`/`col`
 * with optional `rowSpan`/`colSpan`) so it can be written straight back via
 * `Element2DTable.setProperties()`.
 */
export interface TableModelCell {
  row: number
  col: number
  rowSpan?: number
  colSpan?: number
  children?: any[]
  background?: any
  style?: any
}

export interface TableModel {
  columns: { width: number }[]
  rows: { height: number }[]
  cells: TableModelCell[]
}

export interface CellPos {
  row: number
  col: number
}

export interface CellRange {
  minRow: number
  minCol: number
  maxRow: number
  maxCol: number
}

export interface CellRect {
  left: number
  top: number
  width: number
  height: number
}

const DEFAULT_COL_WIDTH = 100
const DEFAULT_ROW_HEIGHT = 40

/** White cell fill so the canvas renders a solid table (not a transparent grid). */
export const CELL_BACKGROUND = '#ffffff'

/** 1px gridline drawn by the canvas on each cell. */
export const CELL_BORDER_STYLE = {
  borderColor: '#e5e7eb',
  borderWidth: 1,
  borderStyle: 'solid',
  boxSizing: 'border-box',
} as const

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value ?? null))
}

export function defaultTextStyle(header = false): any {
  return {
    fontSize: 13,
    color: '#333333',
    textAlign: 'center',
    verticalAlign: 'middle',
    fontWeight: header ? 700 : 400,
  }
}

/**
 * Build a fresh cell child. The text element is given a `width`/`height` to fill
 * its cell at render time (see {@link modelToTable}) so `verticalAlign` centers
 * the text — the canvas has no flex/percent path that does this otherwise.
 */
export function createCellChild(text = '', refStyle?: any): any {
  return {
    style: refStyle ? clone(refStyle) : defaultTextStyle(),
    text: { content: normalizeTextContent(text) },
    meta: { inCanvasIs: 'Element2D' },
  }
}

function createCell(row: number, col: number, ref?: TableModelCell): TableModelCell {
  return {
    row,
    col,
    background: ref?.background ?? CELL_BACKGROUND,
    style: ref?.style ? clone(ref.style) : { ...CELL_BORDER_STYLE },
    children: [createCellChild('', ref?.children?.[0]?.style)],
  }
}

/** Deep-clone a live (normalized) table into an editable model. */
export function cloneTableModel(table: Pick<NormalizedTable, 'columns' | 'rows' | 'cells'>): TableModel {
  return {
    columns: (table.columns ?? []).map(c => ({ width: c.width ?? DEFAULT_COL_WIDTH })),
    rows: (table.rows ?? []).map(r => ({ height: r.height ?? DEFAULT_ROW_HEIGHT })),
    cells: clone(table.cells ?? []) as TableModelCell[],
  }
}

/**
 * Serialise the model into the shape `Element2DTable.setProperties` accepts,
 * sizing each cell's text child to its (possibly merged) cell rect so the
 * canvas vertically/horizontally centers the text.
 */
export function modelToTable(model: TableModel): Table {
  const cells = (clone(model.cells) as TableModelCell[]).map((cell) => {
    const rect = getCellRect(model, cell)
    const child = cell.children?.[0]
    if (child) {
      child.style = { ...child.style, width: rect.width, height: rect.height }
    }
    return cell
  })
  return {
    columns: model.columns.map(c => ({ width: c.width })),
    rows: model.rows.map(r => ({ height: r.height })),
    cells,
  }
}

export function gridWidth(model: TableModel): number {
  return model.columns.reduce((sum, c) => sum + (c.width || 0), 0)
}

export function gridHeight(model: TableModel): number {
  return model.rows.reduce((sum, r) => sum + (r.height || 0), 0)
}

export function colLeft(model: TableModel, col: number): number {
  let x = 0
  for (let i = 0; i < col && i < model.columns.length; i++) x += model.columns[i].width || 0
  return x
}

export function rowTop(model: TableModel, row: number): number {
  let y = 0
  for (let i = 0; i < row && i < model.rows.length; i++) y += model.rows[i].height || 0
  return y
}

export function cellRowSpan(cell: TableModelCell): number {
  return Math.max(1, cell.rowSpan ?? 1)
}

export function cellColSpan(cell: TableModelCell): number {
  return Math.max(1, cell.colSpan ?? 1)
}

/** Pixel rect (relative to the table's top-left) for an anchor cell. */
export function getCellRect(model: TableModel, cell: TableModelCell): CellRect {
  const left = colLeft(model, cell.col)
  const top = rowTop(model, cell.row)
  let width = 0
  for (let c = cell.col; c < cell.col + cellColSpan(cell) && c < model.columns.length; c++) {
    width += model.columns[c].width || 0
  }
  let height = 0
  for (let r = cell.row; r < cell.row + cellRowSpan(cell) && r < model.rows.length; r++) {
    height += model.rows[r].height || 0
  }
  return { left, top, width, height }
}

export function cellRange(cell: TableModelCell): CellRange {
  return {
    minRow: cell.row,
    minCol: cell.col,
    maxRow: cell.row + cellRowSpan(cell) - 1,
    maxCol: cell.col + cellColSpan(cell) - 1,
  }
}

/** Map every covered grid position `"row:col"` to its anchor cell. */
export function buildCoverage(model: TableModel): Map<string, TableModelCell> {
  const map = new Map<string, TableModelCell>()
  for (const cell of model.cells) {
    for (let r = cell.row; r < cell.row + cellRowSpan(cell); r++) {
      for (let c = cell.col; c < cell.col + cellColSpan(cell); c++) {
        map.set(`${r}:${c}`, cell)
      }
    }
  }
  return map
}

export function getCellAt(model: TableModel, row: number, col: number): TableModelCell | undefined {
  return buildCoverage(model).get(`${row}:${col}`)
}

export function getCellText(cell: TableModelCell | undefined): string {
  const content = cell?.children?.[0]?.text?.content
  return content ? textContentToString(content) : ''
}

export function setCellText(cell: TableModelCell, text: string): void {
  if (!cell.children?.length) {
    cell.children = [createCellChild(text)]
    return
  }
  const child = cell.children[0]
  if (!child.text)
    child.text = {}
  child.text.content = normalizeTextContent(text)
}

/**
 * Expand a raw selection so it never cuts through a merged cell — any cell
 * whose span overlaps the range pulls the range out to cover it fully.
 */
export function normalizeRange(model: TableModel, range: CellRange): CellRange {
  const result: CellRange = { ...range }
  let changed = true
  while (changed) {
    changed = false
    for (const cell of model.cells) {
      const cr = cellRange(cell)
      const overlaps
        = cr.minRow <= result.maxRow && cr.maxRow >= result.minRow
          && cr.minCol <= result.maxCol && cr.maxCol >= result.minCol
      if (!overlaps)
        continue
      if (cr.minRow < result.minRow) {
        result.minRow = cr.minRow
        changed = true
      }
      if (cr.minCol < result.minCol) {
        result.minCol = cr.minCol
        changed = true
      }
      if (cr.maxRow > result.maxRow) {
        result.maxRow = cr.maxRow
        changed = true
      }
      if (cr.maxCol > result.maxCol) {
        result.maxCol = cr.maxCol
        changed = true
      }
    }
  }
  return result
}

/** Fill any uncovered grid position with a fresh 1×1 cell; clamp out-of-range spans. */
function repairModel(model: TableModel): void {
  const numRows = model.rows.length
  const numCols = model.columns.length
  // Drop cells whose anchor fell out of bounds; clamp spans to the grid.
  model.cells = model.cells.filter(cell => cell.row < numRows && cell.col < numCols && cell.row >= 0 && cell.col >= 0)
  for (const cell of model.cells) {
    cell.rowSpan = Math.min(cellRowSpan(cell), numRows - cell.row)
    cell.colSpan = Math.min(cellColSpan(cell), numCols - cell.col)
    if (cell.rowSpan <= 1)
      delete cell.rowSpan
    if (cell.colSpan <= 1)
      delete cell.colSpan
  }
  // De-dupe: keep the first anchor that claims a position, drop later overlaps.
  const claimed = new Map<string, TableModelCell>()
  model.cells = model.cells.filter((cell) => {
    if (claimed.has(`${cell.row}:${cell.col}`))
      return false
    claimed.set(`${cell.row}:${cell.col}`, cell)
    return true
  })
  // Fill holes.
  const coverage = buildCoverage(model)
  for (let r = 0; r < numRows; r++) {
    for (let c = 0; c < numCols; c++) {
      if (!coverage.get(`${r}:${c}`)) {
        const cell = createCell(r, c)
        model.cells.push(cell)
        coverage.set(`${r}:${c}`, cell)
      }
    }
  }
  model.cells.sort((a, b) => a.row - b.row || a.col - b.col)
}

export function insertRow(model: TableModel, index: number): void {
  const numCols = model.columns.length
  const refHeight = model.rows[Math.min(index, model.rows.length - 1)]?.height ?? DEFAULT_ROW_HEIGHT
  model.rows.splice(index, 0, { height: refHeight })
  for (const cell of model.cells) {
    const span = cellRowSpan(cell)
    if (index <= cell.row) {
      cell.row += 1
    }
    else if (index < cell.row + span) {
      cell.rowSpan = span + 1
    }
  }
  // New single cells for the inserted row, on columns not covered by a grown span.
  const coverage = buildCoverage(model)
  for (let c = 0; c < numCols; c++) {
    if (!coverage.get(`${index}:${c}`)) {
      const above = coverage.get(`${index - 1}:${c}`) ?? coverage.get(`${index + 1}:${c}`)
      model.cells.push(createCell(index, c, above))
    }
  }
  repairModel(model)
}

export function insertColumn(model: TableModel, index: number): void {
  const numRows = model.rows.length
  const refWidth = model.columns[Math.min(index, model.columns.length - 1)]?.width ?? DEFAULT_COL_WIDTH
  model.columns.splice(index, 0, { width: refWidth })
  for (const cell of model.cells) {
    const span = cellColSpan(cell)
    if (index <= cell.col) {
      cell.col += 1
    }
    else if (index < cell.col + span) {
      cell.colSpan = span + 1
    }
  }
  const coverage = buildCoverage(model)
  for (let r = 0; r < numRows; r++) {
    if (!coverage.get(`${r}:${index}`)) {
      const before = coverage.get(`${r}:${index - 1}`) ?? coverage.get(`${r}:${index + 1}`)
      model.cells.push(createCell(r, index, before))
    }
  }
  repairModel(model)
}

export function removeRow(model: TableModel, index: number): void {
  if (model.rows.length <= 1)
    return
  model.rows.splice(index, 1)
  const next: TableModelCell[] = []
  for (const cell of model.cells) {
    const span = cellRowSpan(cell)
    const last = cell.row + span - 1
    if (index < cell.row) {
      cell.row -= 1
      next.push(cell)
    }
    else if (index > last) {
      next.push(cell)
    }
    else {
      // The removed row intersects this cell.
      if (span <= 1)
        continue // solely in the removed row → drops with it
      cell.rowSpan = span - 1
      next.push(cell)
    }
  }
  model.cells = next
  repairModel(model)
}

export function removeColumn(model: TableModel, index: number): void {
  if (model.columns.length <= 1)
    return
  model.columns.splice(index, 1)
  const next: TableModelCell[] = []
  for (const cell of model.cells) {
    const span = cellColSpan(cell)
    const last = cell.col + span - 1
    if (index < cell.col) {
      cell.col -= 1
      next.push(cell)
    }
    else if (index > last) {
      next.push(cell)
    }
    else {
      if (span <= 1)
        continue
      cell.colSpan = span - 1
      next.push(cell)
    }
  }
  model.cells = next
  repairModel(model)
}

/** Merge a (normalized) range into its top-left cell, dropping the rest. */
export function mergeRange(model: TableModel, range: CellRange): TableModelCell | undefined {
  const r = normalizeRange(model, range)
  if (r.minRow === r.maxRow && r.minCol === r.maxCol)
    return undefined
  const anchor = getCellAt(model, r.minRow, r.minCol)
  if (!anchor)
    return undefined
  anchor.row = r.minRow
  anchor.col = r.minCol
  anchor.rowSpan = r.maxRow - r.minRow + 1
  anchor.colSpan = r.maxCol - r.minCol + 1
  model.cells = model.cells.filter((cell) => {
    if (cell === anchor)
      return true
    return cell.row < r.minRow || cell.row > r.maxRow || cell.col < r.minCol || cell.col > r.maxCol
  })
  if (anchor.rowSpan <= 1)
    delete anchor.rowSpan
  if (anchor.colSpan <= 1)
    delete anchor.colSpan
  model.cells.sort((a, b) => a.row - b.row || a.col - b.col)
  return anchor
}

/** Reset a merged cell back to 1×1, re-filling the freed positions. */
export function splitCell(model: TableModel, cell: TableModelCell): void {
  if (cellRowSpan(cell) <= 1 && cellColSpan(cell) <= 1)
    return
  delete cell.rowSpan
  delete cell.colSpan
  repairModel(model)
}

export function isMergedCell(cell: TableModelCell): boolean {
  return cellRowSpan(cell) > 1 || cellColSpan(cell) > 1
}

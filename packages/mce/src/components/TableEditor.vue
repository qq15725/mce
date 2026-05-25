<script lang="ts" setup>
import type { Element2D } from 'modern-canvas'
import type { CellPos, CellRange, TableModel, TableModelCell } from '../utils/table'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useEditor } from '../composables/editor'
import {
  cellRange,
  cloneTableModel,
  colLeft,
  getCellAt,
  getCellRect,
  getCellText,
  gridHeight,
  gridWidth,
  insertColumn,
  insertRow,
  isMergedCell,
  mergeRange,
  modelToTable,
  normalizeRange,
  removeColumn,
  removeRow,
  rowTop,
  setCellText,
  splitCell,
} from '../utils/table'

const {
  elementSelection,
  state,
  getObb,
  camera,
  t,
} = useEditor()

// Spreadsheet chrome dimensions, in world units (scale with the table's zoom).
const COL_H = 22 // column-header bar height
const ROW_W = 28 // row-header bar width
const BAR_H = 26 // formula/name bar height

/** Spreadsheet column label: 0→A, 25→Z, 26→AA … */
function colLabel(index: number): string {
  let s = ''
  let n = index
  do {
    s = String.fromCharCode(65 + (n % 26)) + s
    n = Math.floor(n / 26) - 1
  } while (n >= 0)
  return s
}

const editingEl = ref<Element2D>()
const model = ref<TableModel>()
const anchor = ref<CellPos>({ row: 0, col: 0 })
const focus = ref<CellPos>({ row: 0, col: 0 })
const editingPos = ref<CellPos | null>(null)
const selecting = ref(false)
const menu = ref<{ x: number, y: number } | null>(null)
const editBox = ref<HTMLElement>()

// Internal clipboard for cell regions (text matrix).
let clipboard: { rows: number, cols: number, texts: string[][] } | null = null

const active = computed(() => state.value === 'tableEditing' && !!model.value)

const mainStyleWithScale = computed(() => {
  const { zoom, position } = camera.value
  return {
    transformOrigin: 'left top',
    transform: `translate(${-position.x}px, ${-position.y}px) scale(${zoom.x}, ${zoom.y})`,
  }
})

const tableBoxStyle = computed(() => {
  const el = editingEl.value
  if (!el)
    return {}
  const obb = getObb(el)
  return {
    left: `${obb.left}px`,
    top: `${obb.top}px`,
    width: `${gridWidth(model.value!)}px`,
    height: `${gridHeight(model.value!)}px`,
    transform: obb.rotationDegrees ? `rotate(${obb.rotationDegrees}deg)` : undefined,
    transformOrigin: 'center center',
  }
})

// All anchor cells with their pixel rects, for rendering.
const renderCells = computed(() => {
  const m = model.value
  if (!m)
    return []
  return m.cells.map(cell => ({ cell, rect: getCellRect(m, cell) }))
})

const colBoundaries = computed(() => {
  const m = model.value
  if (!m)
    return [] as number[]
  return m.columns.map((_, i) => colLeft(m, i + 1))
})

const rowBoundaries = computed(() => {
  const m = model.value
  if (!m)
    return [] as number[]
  return m.rows.map((_, i) => rowTop(m, i + 1))
})

const selectionRange = computed<CellRange>(() => {
  const m = model.value
  if (!m)
    return { minRow: 0, minCol: 0, maxRow: 0, maxCol: 0 }
  return normalizeRange(m, {
    minRow: Math.min(anchor.value.row, focus.value.row),
    minCol: Math.min(anchor.value.col, focus.value.col),
    maxRow: Math.max(anchor.value.row, focus.value.row),
    maxCol: Math.max(anchor.value.col, focus.value.col),
  })
})

const selectionRectStyle = computed(() => {
  const m = model.value
  if (!m)
    return {}
  const r = selectionRange.value
  const left = colLeft(m, r.minCol)
  const top = rowTop(m, r.minRow)
  let width = 0
  for (let c = r.minCol; c <= r.maxCol; c++) width += m.columns[c]?.width || 0
  let height = 0
  for (let row = r.minRow; row <= r.maxRow; row++) height += m.rows[row]?.height || 0
  return { left: `${left}px`, top: `${top}px`, width: `${width}px`, height: `${height}px` }
})

const isSingleSelection = computed(() => {
  const r = selectionRange.value
  return r.minRow === r.maxRow && r.minCol === r.maxCol
})

// Active-cell reference (e.g. "B3") + its text, for the formula/name bar.
const activeCellRef = computed(() => `${colLabel(focus.value.col)}${focus.value.row + 1}`)
const activeCellText = computed(() => getCellText(model.value ? getCellAt(model.value, focus.value.row, focus.value.col) : undefined))

function isColActive(ci: number): boolean {
  const r = selectionRange.value
  return ci >= r.minCol && ci <= r.maxCol
}

function isRowActive(ri: number): boolean {
  const r = selectionRange.value
  return ri >= r.minRow && ri <= r.maxRow
}

const editingCell = computed(() => {
  const m = model.value
  const pos = editingPos.value
  return m && pos ? getCellAt(m, pos.row, pos.col) : undefined
})

const editingRectStyle = computed(() => {
  const m = model.value
  const cell = editingCell.value
  if (!m || !cell)
    return { display: 'none' }
  const rect = getCellRect(m, cell)
  return {
    left: `${rect.left}px`,
    top: `${rect.top}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
  }
})

const selectedAnchorMerged = computed(() => {
  const m = model.value
  if (!m)
    return false
  const cell = getCellAt(m, selectionRange.value.minRow, selectionRange.value.minCol)
  return cell ? isMergedCell(cell) : false
})

function cellContentStyle(cell: TableModelCell): Record<string, string> {
  const s = cell.children?.[0]?.style ?? {}
  const align = s.textAlign ?? 'center'
  const valign = s.verticalAlign ?? 'middle'
  return {
    fontSize: `${s.fontSize ?? 13}px`,
    color: s.color ?? '#333333',
    fontWeight: String(s.fontWeight ?? 400),
    textAlign: align,
    justifyContent: align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center',
    alignItems: valign === 'top' ? 'flex-start' : valign === 'bottom' ? 'flex-end' : 'center',
  }
}

// ── enter / exit ─────────────────────────────────────────────────────────────

// The canvas keeps rendering the table content (text/backgrounds) the whole
// time — the overlay only draws interaction UI + chrome. So every structural or
// text change is written straight back to `el.table`, which re-renders live.
function flush(): void {
  const el = editingEl.value
  const m = model.value
  if (!el || !m)
    return
  el.style.width = gridWidth(m)
  el.style.height = gridHeight(m)
  el.table.setProperties(modelToTable(m))
}

function enter(el: Element2D): void {
  editingEl.value = el
  model.value = cloneTableModel(el.table)
  anchor.value = { row: 0, col: 0 }
  focus.value = { row: 0, col: 0 }
  editingPos.value = null
  menu.value = null
}

function exit(): void {
  commitEdit()
  flush()
  editingEl.value = undefined
  model.value = undefined
  editingPos.value = null
  selecting.value = false
  menu.value = null
}

watch(
  () => state.value,
  (now, prev) => {
    if (now === 'tableEditing' && prev !== 'tableEditing') {
      const el = elementSelection.value[0]
      if (el?.table.isValid()) {
        enter(el)
      }
      else {
        state.value = undefined
      }
    }
    else if (prev === 'tableEditing' && now !== 'tableEditing') {
      exit()
    }
  },
)

// ── selection ─────────────────────────────────────────────────────────────────

function selectCell(pos: CellPos, extend = false): void {
  closeMenu()
  if (!extend) {
    anchor.value = { ...pos }
  }
  focus.value = { ...pos }
}

function onCellPointerdown(e: PointerEvent, cell: TableModelCell): void {
  if (e.button === 2)
    return // context menu handled separately
  if (editingPos.value && editingPos.value.row === cell.row && editingPos.value.col === cell.col) {
    return // already editing this cell, let caret work
  }
  e.stopPropagation()
  commitEdit()
  const pos = { row: cell.row, col: cell.col }
  if (e.shiftKey) {
    selectCell(pos, true)
  }
  else {
    selectCell(pos)
    selecting.value = true
  }
}

function onCellPointerenter(cell: TableModelCell): void {
  if (selecting.value) {
    focus.value = { row: cell.row, col: cell.col }
  }
}

function onCellDblclick(e: MouseEvent, cell: TableModelCell): void {
  e.stopPropagation()
  startEdit({ row: cell.row, col: cell.col })
}

function onWindowPointerup(): void {
  selecting.value = false
}

// ── header selection ────────────────────────────────────────────────────────

function selectColumn(col: number): void {
  closeMenu()
  commitEdit()
  const m = model.value!
  anchor.value = { row: 0, col }
  focus.value = { row: m.rows.length - 1, col }
}

function selectRow(row: number): void {
  closeMenu()
  commitEdit()
  const m = model.value!
  anchor.value = { row, col: 0 }
  focus.value = { row, col: m.columns.length - 1 }
}

function selectAll(): void {
  closeMenu()
  commitEdit()
  const m = model.value!
  anchor.value = { row: 0, col: 0 }
  focus.value = { row: m.rows.length - 1, col: m.columns.length - 1 }
}

// ── cell text editing ─────────────────────────────────────────────────────────

function startEdit(pos: CellPos, initial?: string): void {
  const m = model.value!
  const cell = getCellAt(m, pos.row, pos.col)
  if (!cell)
    return
  anchor.value = { row: cell.row, col: cell.col }
  focus.value = { row: cell.row, col: cell.col }
  editingPos.value = { row: cell.row, col: cell.col }
  nextTick(() => {
    const box = editBox.value
    if (!box)
      return
    box.textContent = initial ?? getCellText(cell)
    box.focus()
    const sel = window.getSelection()
    const range = document.createRange()
    range.selectNodeContents(box)
    range.collapse(false)
    sel?.removeAllRanges()
    sel?.addRange(range)
  })
}

function commitEdit(): void {
  const pos = editingPos.value
  const box = editBox.value
  const m = model.value
  if (!pos || !box || !m) {
    editingPos.value = null
    return
  }
  const cell = getCellAt(m, pos.row, pos.col)
  editingPos.value = null
  if (cell) {
    setCellText(cell, (box.textContent ?? '').replace(/\n$/, ''))
    flush()
  }
}

function onEditBlur(): void {
  commitEdit()
}

// ── structural ops ──────────────────────────────────────────────────────────

function withMutation(fn: () => void): void {
  commitEdit()
  closeMenu()
  fn()
  flush()
}

function doInsertRow(offset: number): void {
  withMutation(() => insertRow(model.value!, selectionRange.value.minRow + offset))
}

function doInsertColumn(offset: number): void {
  withMutation(() => insertColumn(model.value!, selectionRange.value.minCol + offset))
}

function doRemoveRows(): void {
  withMutation(() => {
    const r = selectionRange.value
    for (let row = r.maxRow; row >= r.minRow; row--) removeRow(model.value!, row)
    clampSelection()
  })
}

function doRemoveColumns(): void {
  withMutation(() => {
    const r = selectionRange.value
    for (let col = r.maxCol; col >= r.minCol; col--) removeColumn(model.value!, col)
    clampSelection()
  })
}

function doMerge(): void {
  withMutation(() => {
    const cell = mergeRange(model.value!, selectionRange.value)
    if (cell) {
      anchor.value = { row: cell.row, col: cell.col }
      focus.value = { row: cell.row, col: cell.col }
    }
  })
}

function doSplit(): void {
  withMutation(() => {
    const cell = getCellAt(model.value!, selectionRange.value.minRow, selectionRange.value.minCol)
    if (cell)
      splitCell(model.value!, cell)
  })
}

function clampSelection(): void {
  const m = model.value!
  const maxRow = m.rows.length - 1
  const maxCol = m.columns.length - 1
  anchor.value = { row: Math.min(anchor.value.row, maxRow), col: Math.min(anchor.value.col, maxCol) }
  focus.value = { row: Math.min(focus.value.row, maxRow), col: Math.min(focus.value.col, maxCol) }
}

// ── resize ────────────────────────────────────────────────────────────────────

function onColResizeDown(e: PointerEvent, col: number): void {
  e.stopPropagation()
  e.preventDefault()
  const m = model.value!
  const startX = e.clientX
  const startWidth = m.columns[col].width
  const target = e.currentTarget as HTMLElement
  target.setPointerCapture(e.pointerId)
  const move = (ev: PointerEvent) => {
    const delta = (ev.clientX - startX) / camera.value.zoom.x
    m.columns[col].width = Math.max(20, Math.round(startWidth + delta))
    flush()
  }
  const up = (ev: PointerEvent) => {
    target.releasePointerCapture?.(ev.pointerId)
    target.removeEventListener('pointermove', move)
    target.removeEventListener('pointerup', up)
  }
  target.addEventListener('pointermove', move)
  target.addEventListener('pointerup', up)
}

function onRowResizeDown(e: PointerEvent, row: number): void {
  e.stopPropagation()
  e.preventDefault()
  const m = model.value!
  const startY = e.clientY
  const startHeight = m.rows[row].height
  const target = e.currentTarget as HTMLElement
  target.setPointerCapture(e.pointerId)
  const move = (ev: PointerEvent) => {
    const delta = (ev.clientY - startY) / camera.value.zoom.y
    m.rows[row].height = Math.max(20, Math.round(startHeight + delta))
    flush()
  }
  const up = (ev: PointerEvent) => {
    target.releasePointerCapture?.(ev.pointerId)
    target.removeEventListener('pointermove', move)
    target.removeEventListener('pointerup', up)
  }
  target.addEventListener('pointermove', move)
  target.addEventListener('pointerup', up)
}

// ── context menu ──────────────────────────────────────────────────────────────

function onCellContextmenu(e: MouseEvent, cell: TableModelCell): void {
  e.preventDefault()
  e.stopPropagation()
  const r = selectionRange.value
  const inside = cell.row >= r.minRow && cell.row <= r.maxRow && cell.col >= r.minCol && cell.col <= r.maxCol
  if (!inside) {
    selectCell({ row: cell.row, col: cell.col })
  }
  menu.value = { x: e.clientX, y: e.clientY }
}

function closeMenu(): void {
  menu.value = null
}

// ── clipboard & keyboard ──────────────────────────────────────────────────────

function copySelection(cut = false): void {
  const m = model.value!
  const r = selectionRange.value
  const texts: string[][] = []
  for (let row = r.minRow; row <= r.maxRow; row++) {
    const line: string[] = []
    for (let col = r.minCol; col <= r.maxCol; col++) {
      const cell = getCellAt(m, row, col)
      line.push(cell && cell.row === row && cell.col === col ? getCellText(cell) : '')
    }
    texts.push(line)
  }
  clipboard = { rows: r.maxRow - r.minRow + 1, cols: r.maxCol - r.minCol + 1, texts }
  try {
    navigator.clipboard?.writeText(texts.map(line => line.join('\t')).join('\n'))
  }
  catch {}
  if (cut)
    clearSelection()
}

function pasteClipboard(): void {
  if (!clipboard)
    return
  const m = model.value!
  const r = selectionRange.value
  for (let i = 0; i < clipboard.rows; i++) {
    for (let j = 0; j < clipboard.cols; j++) {
      const cell = getCellAt(m, r.minRow + i, r.minCol + j)
      if (cell && cell.row === r.minRow + i && cell.col === r.minCol + j) {
        setCellText(cell, clipboard.texts[i][j])
      }
    }
  }
  flush()
}

function clearSelection(): void {
  const m = model.value!
  const r = selectionRange.value
  for (const cell of m.cells) {
    const cr = cellRange(cell)
    if (cr.minRow >= r.minRow && cr.maxRow <= r.maxRow && cr.minCol >= r.minCol && cr.maxCol <= r.maxCol) {
      setCellText(cell, '')
    }
  }
  flush()
}

function moveFocus(dRow: number, dCol: number, extend = false): void {
  const m = model.value!
  const next = {
    row: Math.max(0, Math.min(m.rows.length - 1, focus.value.row + dRow)),
    col: Math.max(0, Math.min(m.columns.length - 1, focus.value.col + dCol)),
  }
  selectCell(next, extend)
}

function onKeydown(e: KeyboardEvent): void {
  if (!active.value)
    return

  // While typing inside a cell, only intercept commit / cancel keys.
  if (editingPos.value) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      commitEdit()
      moveFocus(1, 0)
    }
    else if (e.key === 'Escape') {
      e.preventDefault()
      editingPos.value = null
    }
    else if (e.key === 'Tab') {
      e.preventDefault()
      commitEdit()
      moveFocus(0, e.shiftKey ? -1 : 1)
    }
    return
  }

  const mod = e.ctrlKey || e.metaKey
  if (mod) {
    switch (e.key.toLowerCase()) {
      case 'a':
        e.preventDefault()
        selectAll()
        return
      case 'c':
        e.preventDefault()
        copySelection()
        return
      case 'x':
        e.preventDefault()
        copySelection(true)
        return
      case 'v':
        e.preventDefault()
        pasteClipboard()
        return
    }
    return
  }

  switch (e.key) {
    case 'Escape':
      e.preventDefault()
      state.value = undefined
      break
    case 'Enter':
    case 'F2':
      e.preventDefault()
      startEdit(focus.value)
      break
    case 'Delete':
    case 'Backspace':
      e.preventDefault()
      clearSelection()
      break
    case 'Tab':
      e.preventDefault()
      moveFocus(0, e.shiftKey ? -1 : 1)
      break
    case 'ArrowUp':
      e.preventDefault()
      moveFocus(-1, 0, e.shiftKey)
      break
    case 'ArrowDown':
      e.preventDefault()
      moveFocus(1, 0, e.shiftKey)
      break
    case 'ArrowLeft':
      e.preventDefault()
      moveFocus(0, -1, e.shiftKey)
      break
    case 'ArrowRight':
      e.preventDefault()
      moveFocus(0, 1, e.shiftKey)
      break
    default:
      // Printable character → start editing, replacing content.
      if (e.key.length === 1 && !e.altKey) {
        startEdit(focus.value, '')
      }
      break
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown, true)
  window.addEventListener('pointerup', onWindowPointerup)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown, true)
  window.removeEventListener('pointerup', onWindowPointerup)
})
</script>

<template>
  <div
    v-show="active"
    class="m-table-editor"
    :style="mainStyleWithScale"
    @contextmenu.prevent
  >
    <div
      v-if="model"
      class="m-table-editor__box"
      :style="tableBoxStyle"
      @pointerdown.stop
    >
      <!-- formula / name bar -->
      <div
        class="m-table-editor__bar"
        :style="{ left: `${-ROW_W}px`, top: `${-(COL_H + BAR_H)}px`, width: `${ROW_W + gridWidth(model)}px`, height: `${BAR_H}px` }"
      >
        <div class="m-table-editor__bar-name">
          {{ activeCellRef }}
        </div>
        <div class="m-table-editor__bar-content">
          {{ activeCellText }}
        </div>
      </div>

      <!-- corner select-all -->
      <div
        class="m-table-editor__corner"
        :style="{ left: `${-ROW_W}px`, top: `${-COL_H}px`, width: `${ROW_W}px`, height: `${COL_H}px` }"
        @pointerdown.stop="selectAll"
      />

      <!-- column headers -->
      <div
        v-for="(col, ci) in model.columns"
        :key="`ch-${ci}`"
        class="m-table-editor__col-header"
        :class="{ 'm-table-editor__col-header--active': isColActive(ci) }"
        :style="{ left: `${colLeft(model, ci)}px`, top: `${-COL_H}px`, width: `${col.width}px`, height: `${COL_H}px` }"
        @pointerdown.stop="selectColumn(ci)"
      >
        {{ colLabel(ci) }}
      </div>
      <div
        v-for="(x, ci) in colBoundaries"
        :key="`cr-${ci}`"
        class="m-table-editor__col-resizer"
        :style="{ left: `${x}px`, top: `${-COL_H}px`, height: `${COL_H}px` }"
        @pointerdown="onColResizeDown($event, ci)"
      />

      <!-- row headers -->
      <div
        v-for="(row, ri) in model.rows"
        :key="`rh-${ri}`"
        class="m-table-editor__row-header"
        :class="{ 'm-table-editor__row-header--active': isRowActive(ri) }"
        :style="{ left: `${-ROW_W}px`, top: `${rowTop(model, ri)}px`, width: `${ROW_W}px`, height: `${row.height}px` }"
        @pointerdown.stop="selectRow(ri)"
      >
        {{ ri + 1 }}
      </div>
      <div
        v-for="(y, ri) in rowBoundaries"
        :key="`rr-${ri}`"
        class="m-table-editor__row-resizer"
        :style="{ left: `${-ROW_W}px`, top: `${y}px`, width: `${ROW_W}px` }"
        @pointerdown="onRowResizeDown($event, ri)"
      />

      <!-- cells: transparent hit areas + auxiliary gridline; the canvas draws
           the actual cell text/background underneath. -->
      <div
        v-for="{ cell, rect } in renderCells"
        :key="`${cell.row}:${cell.col}`"
        class="m-table-editor__cell"
        :style="{ left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px` }"
        @pointerdown="onCellPointerdown($event, cell)"
        @pointerenter="onCellPointerenter(cell)"
        @dblclick="onCellDblclick($event, cell)"
        @contextmenu="onCellContextmenu($event, cell)"
      />

      <!-- selection overlay -->
      <div
        class="m-table-editor__selection"
        :class="{ 'm-table-editor__selection--range': !isSingleSelection }"
        :style="selectionRectStyle"
      />

      <!-- single cell text editor, positioned over the editing cell -->
      <div
        v-if="editingCell"
        ref="editBox"
        class="m-table-editor__content m-table-editor__content--editing"
        contenteditable="true"
        :style="{ ...editingRectStyle, ...cellContentStyle(editingCell) }"
        @blur="onEditBlur"
        @pointerdown.stop
        @dblclick.stop
      />
    </div>

    <!-- context menu: teleported to body so the camera transform on the root
         doesn't distort its fixed positioning -->
    <Teleport to="body">
      <div
        v-if="menu"
        class="m-table-editor__menu"
        :style="{ left: `${menu.x}px`, top: `${menu.y}px` }"
        @pointerdown.stop
        @contextmenu.prevent
      >
        <button class="m-table-editor__menu-item" @click="doInsertRow(0)">
          {{ t('table:insertRowAbove') }}
        </button>
        <button class="m-table-editor__menu-item" @click="doInsertRow(1)">
          {{ t('table:insertRowBelow') }}
        </button>
        <button class="m-table-editor__menu-item" @click="doInsertColumn(0)">
          {{ t('table:insertColLeft') }}
        </button>
        <button class="m-table-editor__menu-item" @click="doInsertColumn(1)">
          {{ t('table:insertColRight') }}
        </button>
        <div class="m-table-editor__menu-sep" />
        <button class="m-table-editor__menu-item" @click="doRemoveRows()">
          {{ t('table:deleteRow') }}
        </button>
        <button class="m-table-editor__menu-item" @click="doRemoveColumns()">
          {{ t('table:deleteCol') }}
        </button>
        <div class="m-table-editor__menu-sep" />
        <button class="m-table-editor__menu-item" :disabled="isSingleSelection" @click="doMerge()">
          {{ t('table:mergeCells') }}
        </button>
        <button class="m-table-editor__menu-item" :disabled="!selectedAnchorMerged" @click="doSplit()">
          {{ t('table:splitCell') }}
        </button>
      </div>
    </Teleport>
  </div>
</template>

<style lang="scss">
.m-table-editor {
  position: absolute;
  width: 0;
  height: 0;
  left: 0;
  top: 0;
  overflow: visible;
  pointer-events: none;

  $header-bg: #f4f5f7;
  $header-line: rgba(var(--m-theme-on-background), 0.16);

  &__box {
    // Transparent: the canvas renders the table content underneath; this layer
    // only hosts the interaction UI and chrome.
    position: absolute;
    pointer-events: auto;
    box-shadow: 0 0 0 1px rgba(var(--m-theme-primary), 0.5);
  }

  &__bar {
    position: absolute;
    display: flex;
    align-items: stretch;
    box-sizing: border-box;
    background: #fff;
    border: 1px solid $header-line;
    border-bottom: none;
    font-size: 12px;
  }

  &__bar-name {
    flex: none;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    max-width: 56px;
    padding: 0 6px;
    border-right: 1px solid $header-line;
    color: rgb(var(--m-theme-on-background));
    font-weight: 600;
  }

  &__bar-content {
    flex: 1;
    display: flex;
    align-items: center;
    padding: 0 8px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    color: rgb(var(--m-theme-on-background));
  }

  &__cell {
    // Transparent hit area only — the canvas draws the cell fill and gridlines.
    position: absolute;
    box-sizing: border-box;
    cursor: cell;
  }

  &__content {
    width: 100%;
    height: 100%;
    display: flex;
    padding: 2px 4px;
    box-sizing: border-box;
    white-space: pre-wrap;
    word-break: break-word;
    line-height: 1.2;
    overflow: hidden;

    &--editing {
      position: absolute;
      z-index: 4;
      cursor: text;
      outline: 2px solid rgb(var(--m-theme-primary));
      background: rgb(var(--m-theme-background, 255 255 255));
    }
  }

  &__selection {
    position: absolute;
    pointer-events: none;
    z-index: 3;
    border: 2px solid rgb(var(--m-theme-primary));

    &--range {
      background: rgba(var(--m-theme-primary), 0.12);
    }
  }

  &__corner {
    position: absolute;
    box-sizing: border-box;
    background: $header-bg;
    border: 1px solid $header-line;
    cursor: pointer;
    overflow: hidden;

    &::after {
      content: '';
      position: absolute;
      right: 2px;
      bottom: 2px;
      width: 0;
      height: 0;
      border-style: solid;
      border-width: 0 0 7px 7px;
      border-color: transparent transparent rgba(var(--m-theme-on-background), 0.5) transparent;
    }
  }

  &__col-header,
  &__row-header {
    position: absolute;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: center;
    background: $header-bg;
    border: 1px solid $header-line;
    font-size: 12px;
    color: rgba(var(--m-theme-on-background), 0.7);
    cursor: pointer;
    user-select: none;

    &:hover {
      background: rgba(var(--m-theme-primary), 0.12);
    }
  }

  &__col-header--active,
  &__row-header--active {
    background: rgba(var(--m-theme-primary), 0.85);
    color: #fff;
  }

  &__col-resizer {
    position: absolute;
    width: 7px;
    margin-left: -3px;
    cursor: col-resize;
    z-index: 5;
  }

  &__row-resizer {
    position: absolute;
    height: 7px;
    margin-top: -3px;
    cursor: row-resize;
    z-index: 5;
  }

  &__menu {
    position: fixed;
    pointer-events: auto;
    min-width: 160px;
    padding: 4px;
    background: rgb(var(--m-theme-surface, 255 255 255));
    border-radius: 6px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18);
    z-index: 10;
    display: flex;
    flex-direction: column;
  }

  &__menu-item {
    appearance: none;
    border: none;
    background: transparent;
    text-align: left;
    padding: 6px 10px;
    font-size: 13px;
    border-radius: 4px;
    cursor: pointer;
    color: rgb(var(--m-theme-on-surface, 0 0 0));

    &:hover:not(:disabled) {
      background: rgba(var(--m-theme-primary), 0.12);
    }

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
  }

  &__menu-sep {
    height: 1px;
    margin: 4px 6px;
    background: rgba(var(--m-theme-on-background), 0.12);
  }
}
</style>

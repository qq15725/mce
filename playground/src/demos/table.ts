import type { Editor } from 'mce'
import { createTableElement } from '@mce/table'
import { normalizeTextContent } from 'modern-idoc'

// 表格：复用 mce 内建 table 元素（首行表头），并给每个单元格填上示例文案。
export function loadTableDemo(editor: Editor): void {
  const table: any = createTableElement(4, 4, { width: 480, height: 240 })
  table.id = 'table-demo'
  table.style = { ...table.style, left: 0, top: 0 }

  // 默认仅首行表头有字、其余为空，这里给每个单元格都写点字方便演示。
  for (const cell of table.table.cells) {
    const child = cell.children?.[0]
    if (!child)
      continue
    const text = cell.row === 0
      ? `列 ${cell.col + 1}`
      : `R${cell.row}C${cell.col + 1}`
    child.text = { ...child.text, content: normalizeTextContent(text) }
  }

  editor.setDoc([table] as any)
  setTimeout(() => editor.exec('zoomToFit'), 120)
}

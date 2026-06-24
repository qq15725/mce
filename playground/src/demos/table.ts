import type { Editor } from 'mce'
import { createTableElement } from '@mce/table'

// 表格：复用 mce 内建 table 元素（首行表头）。
export function loadTableDemo(editor: Editor): void {
  const table: any = createTableElement(4, 4, { width: 480, height: 240 })
  table.id = 'table-demo'
  table.style = { ...table.style, left: 0, top: 0 }
  editor.setDoc([table] as any)
  setTimeout(() => editor.exec('zoomToFit'), 120)
}

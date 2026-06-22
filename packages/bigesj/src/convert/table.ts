import type { Table } from 'modern-idoc'
import { clearUndef, normalizeTextContent } from 'modern-idoc'

/** canvas 在每个单元格上画的 1px 网格线（与 @mce/table 默认一致）。 */
const CELL_BORDER_STYLE = {
  borderColor: '#e5e7eb',
  borderWidth: 1,
  borderStyle: 'solid',
  boxSizing: 'border-box',
}

/** 把 "k: v; k2: v2" 形式的 CSS 声明串解析为对象。 */
function parseCssDecls(css?: string): Record<string, string> {
  const out: Record<string, string> = {}
  if (typeof css !== 'string') {
    return out
  }
  for (const decl of css.split(';')) {
    const i = decl.indexOf(':')
    if (i < 0) {
      continue
    }
    const key = decl.slice(0, i).trim()
    const val = decl.slice(i + 1).trim()
    if (key) {
      out[key] = val
    }
  }
  return out
}

/** 从 CSS border 简写里取颜色与宽度。 */
function parseBorder(value?: string): { color?: string, width?: number } {
  if (!value) {
    return {}
  }
  const width = value.match(/(\d+(?:\.\d+)?)px/)
  const color = value.match(/#[0-9a-f]{3,8}|rgba?\([^)]+\)/i)
  return { width: width ? Number(width[1]) : undefined, color: color ? color[0] : undefined }
}

/**
 * bigesj table（tableOption：colWidths / rowHeights / data + CSS 选择器样式）→ mce `table` prop。
 *
 * 单元格内容存为子文字元素（与 @mce/table 模型一致）；样式从 td / `tr:first-child td` /
 * nth-child 选择器尽力解析（颜色、字号、对齐、背景、边框，表头加粗 + 表头奇偶列底色）。
 */
export function convertTable(tableOption: any): Table {
  const colWidths: number[] = tableOption?.colWidths ?? []
  const rowHeights: number[] = tableOption?.rowHeights ?? []
  const data: any[][] = tableOption?.data ?? []
  const cssMap: Record<string, string> = tableOption?.style ?? {}

  const tdDecls = parseCssDecls(cssMap.td)
  const headerDecls = parseCssDecls(cssMap['tr:first-child td'])
  const headerOdd = parseCssDecls(cssMap['tr:first-child td:nth-child(odd)'])
  const headerEven = parseCssDecls(cssMap['tr:first-child td:nth-child(even)'])
  const border = parseBorder(tdDecls.border)

  const cellStyle = {
    ...CELL_BORDER_STYLE,
    borderColor: border.color ?? CELL_BORDER_STYLE.borderColor,
    borderWidth: border.width ?? CELL_BORDER_STYLE.borderWidth,
  }

  const cells: any[] = []
  data.forEach((row, r) => {
    row.forEach((cell, c) => {
      const isHeader = r === 0
      const decls = isHeader ? { ...tdDecls, ...headerDecls } : tdDecls
      const fontSize = Number.parseFloat(decls['font-size'] ?? '') || (isHeader ? 16 : 14)
      let background = tdDecls['background-color'] ?? '#ffffff'
      if (isHeader) {
        // nth-child 1-based：奇数列(odd) 对应 0-based 的 c=0,2,4…
        const oddEven = (c % 2 === 0) ? headerOdd : headerEven
        background = oddEven['background-color'] ?? headerDecls['background-color'] ?? background
      }
      cells.push({
        row: r,
        col: c,
        background,
        style: cellStyle,
        children: [
          {
            // 子文字元素填满单元格，便于 verticalAlign 居中（见 @mce/table modelToTable）。
            style: clearUndef({
              fontSize,
              color: decls.color ?? '#333333',
              textAlign: decls['text-align'] ?? 'center',
              verticalAlign: 'middle',
              fontWeight: isHeader ? 700 : 400,
              fontFamily: cell?.style?.fontFamily,
              width: colWidths[c],
              height: rowHeights[r],
            }),
            text: { content: normalizeTextContent(String(cell?.text ?? '')) },
            meta: { inCanvasIs: 'Element2D' },
          },
        ],
      })
    })
  })

  return {
    enabled: true,
    columns: colWidths.map(w => ({ width: w })),
    rows: rowHeights.map(h => ({ height: h })),
    cells,
  } as Table
}

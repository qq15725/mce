import type { Table } from 'modern-idoc'
import { clearUndef, normalizeTextContent } from 'modern-idoc'

/** 单元格最终样式（与 CSS 选择器解析无关的统一中间形态）。 */
interface CellStyle {
  background?: string
  color?: string
  textAlign?: string
  fontSize?: number
  fontFamily?: string
  fontWeight?: number
}

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

function toFontWeight(value?: string): number | undefined {
  if (!value) {
    return undefined
  }
  if (value === 'bold' || value === 'bolder') {
    return 700
  }
  if (value === 'normal' || value === 'lighter') {
    return 400
  }
  return Number(value) || undefined
}

// ── 浏览器路径：getComputedStyle 沙箱（覆盖任意主题的全部 CSS 选择器，含 first/last/nth-child） ──
// 与 bige 编辑器 parseCustomStyle 同思路：把 data 渲染成隐藏 <table>、套上主题 CSS，逐格读计算样式。
let sandbox: HTMLIFrameElement | undefined
function getSandboxDoc(): Document | undefined {
  if (typeof document === 'undefined') {
    return undefined
  }
  if (sandbox?.contentWindow?.document) {
    return sandbox.contentWindow.document
  }
  try {
    sandbox = document.createElement('iframe')
    sandbox.setAttribute('aria-hidden', 'true')
    Object.assign(sandbox.style, {
      position: 'fixed',
      width: '0',
      height: '0',
      border: '0',
      visibility: 'hidden',
    })
    document.body.appendChild(sandbox)
    return sandbox.contentWindow?.document
  }
  catch {
    return undefined
  }
}

function computeCellStyles(cssMap: Record<string, string>, data: any[][]): CellStyle[][] | undefined {
  const doc = getSandboxDoc()
  const win = doc?.defaultView
  if (!doc || !win) {
    return undefined
  }
  try {
    const styleEl = doc.createElement('style')
    styleEl.textContent = Object.entries(cssMap)
      .map(([sel, decl]) => `${sel}{${decl}}`)
      .join('\n')
    const table = doc.createElement('table')
    // 仅需网格结构（行列数）来解析 nth-child / first/last，无需真实文字，故用空单元格。
    table.innerHTML = data.map(row => `<tr>${row.map(() => '<td></td>').join('')}</tr>`).join('')
    doc.head.appendChild(styleEl)
    doc.body.appendChild(table)
    const result = Array.from(table.querySelectorAll('tr')).map(tr =>
      Array.from(tr.querySelectorAll('td')).map((td) => {
        const cs = win.getComputedStyle(td)
        const bg = cs.backgroundColor
        return {
          background: (!bg || bg === 'transparent' || bg === 'rgba(0, 0, 0, 0)') ? '#ffffff' : bg,
          color: cs.color || undefined,
          textAlign: cs.textAlign || undefined,
          fontSize: Number.parseFloat(cs.fontSize) || undefined,
          fontFamily: cs.fontFamily || undefined,
          fontWeight: toFontWeight(cs.fontWeight),
        } satisfies CellStyle
      }),
    )
    doc.head.removeChild(styleEl)
    doc.body.removeChild(table)
    return result
  }
  catch {
    return undefined
  }
}

// ── 兜底路径：手写选择器解析（无 DOM / 单测环境）。覆盖 bige 主题常见选择器。 ──
function manualResolver(cssMap: Record<string, string>): (r: number, c: number) => CellStyle {
  const td = parseCssDecls(cssMap.td)
  const header = parseCssDecls(cssMap['tr:first-child td'])
  const headerOdd = parseCssDecls(cssMap['tr:first-child td:nth-child(odd)'])
  const headerEven = parseCssDecls(cssMap['tr:first-child td:nth-child(even)'])
  return (r, c) => {
    const isHeader = r === 0
    const decls = isHeader ? { ...td, ...header } : td
    let background = td['background-color'] ?? '#ffffff'
    if (isHeader) {
      // nth-child 1-based：奇数列(odd) 对应 0-based 的 c=0,2,4…
      const oddEven = (c % 2 === 0) ? headerOdd : headerEven
      background = oddEven['background-color'] ?? header['background-color'] ?? background
    }
    return {
      background,
      color: decls.color ?? '#333333',
      textAlign: decls['text-align'] ?? 'center',
      fontSize: Number.parseFloat(decls['font-size'] ?? '') || (isHeader ? 16 : 14),
      fontWeight: toFontWeight(decls['font-weight']) ?? (isHeader ? 700 : 400),
    }
  }
}

/**
 * bigesj table（tableOption：colWidths / rowHeights / data + CSS 选择器样式）→ mce `table` prop。
 *
 * 单元格内容存为子文字元素（与 @mce/table 模型一致）。样式优先用浏览器 getComputedStyle 解析每格
 * 最终值（覆盖任意主题的全部选择器，与 bige 编辑器同思路），无 DOM 时回退到手写选择器解析。
 * 边框取 td 简写并统一应用（mce 单元格边框是四边统一，无法表达逐边差异）。
 */
export function convertTable(tableOption: any): Table {
  const colWidths: number[] = tableOption?.colWidths ?? []
  const rowHeights: number[] = tableOption?.rowHeights ?? []
  const data: any[][] = tableOption?.data ?? []
  // userStyle（用户自定义）优先于 style（主题），与 bige parseCustomStyle 一致。
  const cssMap: Record<string, string> = tableOption?.userStyle ?? tableOption?.style ?? {}

  const border = parseBorder(parseCssDecls(cssMap.td).border)
  const cellStyle = {
    ...CELL_BORDER_STYLE,
    borderColor: border.color ?? CELL_BORDER_STYLE.borderColor,
    borderWidth: border.width ?? CELL_BORDER_STYLE.borderWidth,
  }

  const computed = computeCellStyles(cssMap, data)
  const manual = computed ? undefined : manualResolver(cssMap)

  const cells: any[] = []
  data.forEach((row, r) => {
    row.forEach((cell, c) => {
      const s = computed?.[r]?.[c] ?? manual?.(r, c) ?? {}
      cells.push({
        row: r,
        col: c,
        background: s.background,
        style: cellStyle,
        children: [
          {
            // 子文字元素填满单元格，便于 verticalAlign 居中（见 @mce/table modelToTable）。
            style: clearUndef({
              fontSize: s.fontSize,
              color: s.color,
              textAlign: s.textAlign,
              verticalAlign: 'middle',
              fontWeight: s.fontWeight,
              // 单元格自带 fontFamily（cell.style）优先于解析出的计算值。
              fontFamily: cell?.style?.fontFamily ?? s.fontFamily,
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

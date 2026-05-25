import type { Chart, ChartType, Element, Fill, Outline, ShapeConnectionPoint, TableCellObject } from 'modern-idoc'
import type { Options } from 'modern-text'
import { normalizeTextContent } from 'modern-idoc'
import { measureText } from 'modern-text'
import { getImageSizeFromUrl } from './image'
import { CELL_BACKGROUND, CELL_BORDER_STYLE, defaultTextStyle } from './table'

// A unit rectangle path; the shape is scaled to fill the element's box, so the
// exact coordinates don't matter — only that it draws a full rectangle.
const RECT_PATH = 'M0 0h24v24H0z'

// Edge anchors for connectors: x/y are normalized (0..1) within the box, `ang`
// is the exit direction in radians (canvas y is down, so π/2 points down).
const FLOW_CONNECTION_POINTS: ShapeConnectionPoint[] = [
  { idx: 0, x: 1, y: 0.5, ang: 0 }, // right
  { idx: 1, x: 0, y: 0.5, ang: Math.PI }, // left
  { idx: 2, x: 0.5, y: 1, ang: Math.PI / 2 }, // bottom
  { idx: 3, x: 0.5, y: 0, ang: -Math.PI / 2 }, // top
]

export function createShapeElement(shape?: Element['shape'], fill?: Fill, outline?: Outline): Element {
  return {
    shape,
    fill,
    outline,
    meta: {
      inPptIs: 'Shape',
      inCanvasIs: 'Element2D',
    },
  }
}

export function createTextElement(content: string, style?: Record<string, any>, fonts?: Options['fonts']): Element {
  // 必须传入 fonts，否则默认的 'font' 测量后端拿不到字体度量，
  // 字符 advanceWidth 全为 0、相互重叠，测出的宽度只剩单字宽（文字会被挤成竖排一列）。
  const box = measureText({ fonts, style, content }).boundingBox

  return {
    style: {
      ...style,
      width: box.width,
      height: box.height,
    },
    text: { content: normalizeTextContent(content) },
    meta: {
      inPptIs: 'Shape',
      inCanvasIs: 'Element2D',
    },
  }
}

export async function createImageElement(image: string): Promise<Element> {
  return {
    style: {
      ...await getImageSizeFromUrl(image),
    },
    foreground: { image },
    meta: {
      inPptIs: 'Picture',
      inCanvasIs: 'Element2D',
      lockAspectRatio: true,
    },
  }
}

export interface CreateCardElementOptions {
  /** Body text below the title. Omitted if empty. */
  body?: string
  width?: number
  height?: number
  fill?: Fill
  outline?: Outline
  borderRadius?: number
  /** Inset of the title/body from the card edges. */
  padding?: number
  titleStyle?: Record<string, any>
  bodyStyle?: Record<string, any>
}

/**
 * A rounded panel with a bold title and optional body, composed as child text
 * elements (so each line keeps its own styling and can be edited in place).
 */
export function createCardElement(title: string, options: CreateCardElementOptions = {}): Element {
  const {
    body,
    width = 220,
    height = 130,
    fill = '#ffffff',
    outline = { color: '#e5e7eb', width: 1 },
    borderRadius = 12,
    padding = 16,
    titleStyle,
    bodyStyle,
  } = options

  // Children must declare `inCanvasIs` themselves — `addElement` only injects it
  // onto the top-level element, not recursively.
  const children: Element[] = [
    {
      style: {
        left: padding,
        top: padding,
        width: width - padding * 2,
        fontSize: 18,
        fontWeight: 700,
        color: '#111827',
        ...titleStyle,
      },
      text: { content: normalizeTextContent(title) },
      meta: { inCanvasIs: 'Element2D' },
    },
  ]
  if (body) {
    children.push({
      style: {
        left: padding,
        top: padding + 32,
        width: width - padding * 2,
        fontSize: 14,
        color: '#6b7280',
        ...bodyStyle,
      },
      text: { content: normalizeTextContent(body) },
      meta: { inCanvasIs: 'Element2D' },
    })
  }

  return {
    style: { width, height, borderRadius, overflow: 'hidden' },
    shape: [{ data: RECT_PATH }],
    fill,
    outline,
    children,
    meta: {
      inPptIs: 'Shape',
      inCanvasIs: 'Element2D',
    },
  }
}

export interface CreateFlowNodeElementOptions {
  width?: number
  height?: number
  fill?: Fill
  outline?: Outline
  borderRadius?: number
  textStyle?: Record<string, any>
  /** Override the default right/left/bottom/top connector anchors. */
  connectionPoints?: ShapeConnectionPoint[]
}

/**
 * A labelled rounded box that exposes connection points, so connectors can
 * attach and route to it. Pairs with the `connection` element.
 */
export function createFlowNodeElement(label = '', options: CreateFlowNodeElementOptions = {}): Element {
  const {
    width = 160,
    height = 72,
    fill = '#e0edff',
    outline = { color: '#4f8cff', width: 2 },
    borderRadius = 8,
    textStyle,
    connectionPoints = FLOW_CONNECTION_POINTS,
  } = options

  return {
    style: {
      width,
      height,
      borderRadius,
      textAlign: 'center',
      verticalAlign: 'middle',
      color: '#1e3a8a',
      ...textStyle,
    },
    shape: { enabled: true, paths: [{ data: RECT_PATH }], connectionPoints },
    fill,
    outline,
    text: { content: normalizeTextContent(label) },
    meta: {
      inPptIs: 'Shape',
      inCanvasIs: 'Element2D',
    },
  }
}

export interface CreateStickyElementOptions {
  width?: number
  height?: number
  fill?: Fill
  color?: string
  fontSize?: number
  padding?: number
}

/** A solid colored note with top-aligned text, e.g. for whiteboard annotations. */
export function createStickyElement(content: string, options: CreateStickyElementOptions = {}): Element {
  const {
    width = 160,
    height = 160,
    fill = '#fff3a0',
    color = '#3f3f46',
    fontSize = 16,
    padding = 14,
  } = options

  return {
    style: { width, height, padding, color, fontSize },
    shape: [{ data: RECT_PATH }],
    fill,
    text: { content: normalizeTextContent(content) },
    meta: {
      inPptIs: 'Shape',
      inCanvasIs: 'Element2D',
    },
  }
}

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

export interface CreateChartElementOptions {
  width?: number
  height?: number
  categories?: string[]
  series?: Chart['series']
}

/** A chart backed by the native `chart` element property (column/line/pie/…). */
export function createChartElement(type: ChartType = 'column', options: CreateChartElementOptions = {}): Element {
  const {
    width = 360,
    height = 240,
    categories = ['一月', '二月', '三月', '四月', '五月'],
    series = [{ name: '系列 1', values: [40, 70, 55, 90, 60] }],
  } = options
  return {
    style: { width, height },
    chart: {
      type,
      categories,
      series,
      legend: 'bottom',
    },
    meta: { inPptIs: 'Shape', inCanvasIs: 'Element2D', inEditorIs: 'Chart' },
  }
}

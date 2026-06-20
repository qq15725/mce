import type { Element2D, Node, PointerInputEvent } from 'modern-canvas'
import type { PropType } from 'vue'
import type { Editor } from '../editor'
import { propsFactory } from '../utils/propsFactory'

export interface ActiveStrategyContext {
  element: Element2D | undefined
  event: PointerInputEvent
  editor: Editor
}

export interface DoubleclickStrategyContext {
  event: PointerInputEvent
  editor: Editor
}

export interface HoverStrategyContext extends ActiveStrategyContext {
  //
}

export type ResizeStrategy = (element: Element2D) =>
  | 'lockAspectRatio'
  | undefined

export type ActiveStrategy = (context: ActiveStrategyContext) =>
  | {
    element: Element2D | undefined
    state: Mce.State | undefined
  }
  | Element2D
  | undefined

export type DoubleclickStrategy = (context: DoubleclickStrategyContext) => void

export type HoverStrategy = (context: HoverStrategyContext) =>
  | {
    element: Element2D | undefined
    cursor: string | undefined
  }
  | Element2D
  | undefined

export const makeMceStrategyProps = propsFactory({
  resizeStrategy: Function as PropType<ResizeStrategy>,
  activeStrategy: Function as PropType<ActiveStrategy>,
  doubleclickStrategy: Function as PropType<DoubleclickStrategy>,
  hoverStrategy: Function as PropType<HoverStrategy>,
}, 'makeMceStrategyProps')

// Table cells render as Element2D nodes parented to the table element (in its
// internal back layer), so a raw hit-test lands on a cell. Cells are managed by
// the table and must never be selected on their own — redirect any cell hit to
// its owning table element so clicks/hover always act on the table as a whole
// (and double-click enters table editing).
function redirectTableCell(
  node: Element2D | undefined,
  isElement: Editor['isElement'],
): Element2D | undefined {
  if (!node) {
    return node
  }
  const owner = node.findAncestor<Element2D>(
    n => isElement(n) && Boolean((n as Element2D).table?.isValid?.()),
  )
  return owner ?? node
}

export const defaultActiveStrategy: ActiveStrategy = (context) => {
  const { element, event, editor } = context

  if (!element) {
    return undefined
  }

  const {
    isRootNode,
    inEditorIs,
    isElement,
    elementSelection,
  } = editor

  // Cmd/Ctrl 深选（Figma）：直接命中光标下最深元素，跳过组 / 帧的逐层归并。
  // 表格单元格仍重定向到表格本身（单元格永不可单独选中）。
  if (event?.metaKey || event?.ctrlKey) {
    return redirectTableCell(element, isElement)
  }

  const activeElement = elementSelection.value[0]

  const cb = (node: Node) => {
    const parent = node.parent
    if (
      isElement(node) && (
        node.equal(activeElement)
        || parent?.equal(activeElement)
        || parent?.equal(activeElement?.parent)
        || (parent && inEditorIs(parent, 'Frame') && parent.parent && isRootNode(parent.parent))
        || (parent && isRootNode(parent))
      )
    ) {
      return true
    }
    return false
  }

  const resolved = cb(element) ? element : element.findAncestor<Element2D>(cb)
  return redirectTableCell(resolved, isElement)
}

export const defaultDoubleclickStrategy: DoubleclickStrategy = (context) => {
  context.editor.exec('enter')
}

export const defaultHoverStrategy: HoverStrategy = (context) => {
  const { element, event, editor } = context

  if (!element) {
    return undefined
  }

  const {
    isRootNode,
    inEditorIs,
    isElement,
    elementSelection,
  } = editor

  // Cmd/Ctrl 深选高亮：与点击一致，悬停时高亮光标下最深元素。
  if (event?.metaKey || event?.ctrlKey) {
    return redirectTableCell(element, isElement)
  }

  const activeElement = elementSelection.value[0]

  const cb = (node: Node) => {
    const parent = node.parent
    if (
      isElement(node) && (
        node.equal(activeElement)
        || parent?.equal(activeElement)
        || parent?.equal(activeElement?.parent)
        || (parent && inEditorIs(parent, 'Frame') && parent.parent && isRootNode(parent.parent))
        || (parent && isRootNode(parent))
      )
    ) {
      return true
    }
    return false
  }

  const resolved = cb(element) ? element : element.findAncestor<Element2D>(cb)
  return redirectTableCell(resolved, isElement)
}

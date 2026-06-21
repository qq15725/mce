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
    resolveSelectionRedirect,
  } = editor

  // Cmd/Ctrl 深选：直接命中光标下最深元素，跳过组 / 帧的逐层归并。
  // 选择重定向（如表格单元格 → 表格）由插件注册，这里统一应用。
  if (event?.metaKey || event?.ctrlKey) {
    return resolveSelectionRedirect(element)
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
  return resolveSelectionRedirect(resolved)
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
    resolveSelectionRedirect,
  } = editor

  // Cmd/Ctrl 深选高亮：与点击一致，悬停时高亮光标下最深元素。
  if (event?.metaKey || event?.ctrlKey) {
    return resolveSelectionRedirect(element)
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
  return resolveSelectionRedirect(resolved)
}

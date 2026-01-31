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
  | 'lockAspectRatioDiagonal'
  | undefined

export type ActiveStrategy = (context: ActiveStrategyContext) =>
  | {
    element: Element2D | undefined
    state: Mce.State | undefined
  }
  | Element2D
  | undefined

export type DoubleclickStrategy = (context: DoubleclickStrategyContext) =>
  | Mce.State
  | undefined

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

export const defaultResizeStrategy: ResizeStrategy = (element) => {
  if (element.meta.lockAspectRatio) {
    return 'lockAspectRatio'
  }
  return undefined
}

export const defaultActiveStrategy: ActiveStrategy = (context) => {
  const { element, editor } = context

  if (!element) {
    return undefined
  }

  const {
    isRootNode,
    inEditorIs,
    isElement,
    elementSelection,
  } = editor

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

  if (cb(element)) {
    return element
  }

  return element.findAncestor<Element2D>(cb)
}

export const defaultDoubleclickStrategy: DoubleclickStrategy = (context) => {
  const { editor } = context
  const { elementSelection } = editor
  const element = elementSelection.value[0]
  if (element && !element.meta.lock) {
    return element.foreground.isValid()
      ? undefined
      : 'typing'
  }
  return undefined
}

export const defaultHoverStrategy: HoverStrategy = (context) => {
  const { element, editor } = context

  if (!element) {
    return undefined
  }

  const {
    isRootNode,
    inEditorIs,
    isElement,
    elementSelection,
  } = editor

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

  if (cb(element)) {
    return element
  }

  return element.findAncestor<Element2D>(cb)
}

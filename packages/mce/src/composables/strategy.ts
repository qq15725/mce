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

/**
 * 点击 / 悬停共用的命中目标解析：Cmd/Ctrl 深选直达最深元素，否则按当前选中元素的
 * 父子归并逐层上溯，最后统一应用选择重定向（如表格单元格 → 表格）。
 */
function resolveSelectionTarget(context: ActiveStrategyContext): Element2D | undefined {
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

export const defaultActiveStrategy: ActiveStrategy = resolveSelectionTarget

export const defaultDoubleclickStrategy: DoubleclickStrategy = (context) => {
  context.editor.exec('editElement')
}

export const defaultHoverStrategy: HoverStrategy = resolveSelectionTarget

import type { Element2D, PointerInputEvent } from 'modern-canvas'
import { definePlugin } from '../plugin'

declare global {
  namespace Mce {
    interface PointerDownOptions {
      allowTopFrame?: boolean
    }

    interface Commands {
      pointerDown: (e: PointerInputEvent, options?: PointerDownOptions) => void
      startTyping: (e?: MouseEvent | PointerEvent) => Promise<boolean>
      startTransform: (e?: MouseEvent | PointerEvent) => boolean
      openContextMenu: (e?: MouseEvent | PointerEvent) => boolean
      layerScrollIntoView: () => boolean
    }

    type TransformableHandle
      = | 'move'
        | 'resize-top'
        | 'resize-right'
        | 'resize-bottom'
        | 'resize-left'
        | 'resize-top-left'
        | 'resize-top-right'
        | 'resize-bottom-left'
        | 'resize-bottom-right'
        | 'rotate-top-left'
        | 'rotate-top-right'
        | 'rotate-bottom-left'
        | 'rotate-bottom-right'
        | 'border-radius-top-left'
        | 'border-radius-top-right'
        | 'border-radius-bottom-left'
        | 'border-radius-bottom-right'

    interface SelectionTransformContext {
      startEvent: MouseEvent | PointerEvent
      handle: TransformableHandle
      elements: Element2D[]
    }

    interface Events {
      selectionTransformStart: [context: SelectionTransformContext]
      selectionTransforming: [context: SelectionTransformContext]
      selectionTransformEnd: [context: SelectionTransformContext]
    }
  }
}

export default definePlugin(() => {
  return {
    name: 'mce:ui',
  }
})

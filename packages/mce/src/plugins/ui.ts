import type { Element2D, PointerInputEvent } from 'modern-canvas'
import { useResizeObserver } from '@vueuse/core'
import { Aabb2D, Vector2 } from 'modern-canvas'
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
        | 'resize-t'
        | 'resize-r'
        | 'resize-b'
        | 'resize-l'
        | 'resize-tl'
        | 'resize-tr'
        | 'resize-bl'
        | 'resize-br'
        | 'rotate-tl'
        | 'rotate-tr'
        | 'rotate-bl'
        | 'rotate-br'
        | 'round-tl'
        | 'round-tr'
        | 'round-bl'
        | 'round-br'

    interface SelectionTransformContext {
      startEvent: MouseEvent | PointerEvent
      handle: TransformableHandle
      elements: Element2D[]
    }

    interface Events {
      pointerMove: [event: PointerEvent]
      selectionTransformStart: [context: SelectionTransformContext]
      selectionTransforming: [context: SelectionTransformContext]
      selectionTransformEnd: [context: SelectionTransformContext]
    }
  }
}

export default definePlugin((editor) => {
  return {
    name: 'mce:ui',
    setup: () => {
      const {
        drawboardDom,
        drawboardAabb,
        drawboardPointer,
        exec,
      } = editor

      useResizeObserver(drawboardDom, (entries) => {
        const { left: _left, top: _top, width, height } = entries[0].contentRect
        const { left = _left, top = _top } = drawboardDom.value?.getBoundingClientRect() ?? {}
        drawboardAabb.value = new Aabb2D(left, top, width, height)
        exec('zoomToFit')
      })

      document.addEventListener('mousemove', (event) => {
        drawboardPointer.value = new Vector2(
          event.clientX - drawboardAabb.value.left,
          event.clientY - drawboardAabb.value.top,
        )
      })
    },
  }
})

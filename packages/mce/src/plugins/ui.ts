import type { PointerInputEvent } from 'modern-canvas'
import { useResizeObserver } from '@vueuse/core'
import { Aabb2D, Vector2 } from 'modern-canvas'
import { onMounted, onScopeDispose } from 'vue'
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

    interface Events {
      pointerMove: [event: PointerEvent]
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
      } = editor

      useResizeObserver(drawboardDom, (entries) => {
        const { left: _left, top: _top, width, height } = entries[0].contentRect
        const { left = _left, top = _top } = drawboardDom.value?.getBoundingClientRect() ?? {}
        drawboardAabb.value = new Aabb2D(left, top, width, height)
      })

      function onMouseMove(event: MouseEvent) {
        drawboardPointer.value = new Vector2(
          event.clientX - drawboardAabb.value.left,
          event.clientY - drawboardAabb.value.top,
        )
      }

      onMounted(() => document.addEventListener('mousemove', onMouseMove))
      onScopeDispose(() => document.removeEventListener('mousemove', onMouseMove))
    },
  }
})

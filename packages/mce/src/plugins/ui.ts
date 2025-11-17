import type { AxisAlignedBoundingBox } from '../types'
import { watch } from 'vue'
import { definePlugin } from '../plugin'

declare global {
  namespace Mce {
    interface Commands {
      startTyping: (e?: MouseEvent | PointerEvent) => Promise<boolean>
      startTransform: (e?: MouseEvent | PointerEvent) => boolean
      openContextMenu: (e?: MouseEvent | PointerEvent) => boolean
    }

    interface Events {
      setTransform: [value: { aabb: AxisAlignedBoundingBox }]
    }
  }
}

export default definePlugin((editor) => {
  const {
    selectionAabbInDrawboard,
    emit,
  } = editor

  return {
    name: 'mce:ui',
    setup: () => {
      // TODO lazy watch
      watch(
        selectionAabbInDrawboard,
        aabb => emit('setTransform', { aabb }),
        { deep: true },
      )
    },
  }
})

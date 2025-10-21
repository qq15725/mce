import type { AxisAlignedBoundingBox } from '../types'
import { watch } from 'vue'
import { definePlugin } from '../editor'

declare global {
  namespace Mce {
    interface Commands {
      startTyping: (e?: PointerEvent) => Promise<boolean>
      startTransform: (e?: PointerEvent) => boolean
    }

    interface Events {
      setTransform: [value: { aabb: AxisAlignedBoundingBox }]
    }
  }
}

export default definePlugin((editor) => {
  const {
    selection,
    getAabbInDrawboard,
    emit,
  } = editor

  return {
    name: 'ui',
    setup: () => {
      // TODO lazy watch
      watch(
        () => getAabbInDrawboard(selection.value),
        aabb => emit('setTransform', { aabb }),
        { deep: true },
      )
    },
  }
})

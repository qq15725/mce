import type { AxisAlignedBoundingBox } from '../types'
import { watch } from 'vue'
import { defineProvider } from '../editor'

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

export default defineProvider((editor) => {
  const {
    activeElement,
    selectedElements,
    getAabbInDrawboard,
    emit,
  } = editor

  return () => {
    // TODO lazy watch
    watch(
      () => getAabbInDrawboard(activeElement.value ?? selectedElements.value),
      aabb => emit('setTransform', { aabb }),
      { deep: true },
    )
  }
})

import type { ComputedRef } from 'vue'
import { computed } from 'vue'
import { defineMixin } from '../editor'

declare global {
  namespace Mce {
    interface Editor {
      screenCenterOffset: ComputedRef<Required<ScreenCenterOffset>>
      screenCenter: ComputedRef<{ x: number, y: number }>
    }
  }
}

export default defineMixin((editor) => {
  const {
    config,
    drawboardAabb,
  } = editor

  const screenCenterOffset = computed(() => {
    const offset = {
      left: 0,
      top: 0,
      bottom: 0,
      right: 0,
      ...config.value.screenCenterOffset,
    }
    if (config.value.scrollbar) {
      offset.right += 8
      offset.bottom += 8
    }
    if (config.value.ruler) {
      offset.left += 16
      offset.top += 16
    }
    return offset
  })

  const screenCenter = computed(() => {
    const offset = screenCenterOffset.value
    return {
      x: offset.left
        + (drawboardAabb.value.width - offset.left - offset.right) / 2,
      y: offset.top
        + (drawboardAabb.value.height - offset.top - offset.bottom) / 2,
    }
  })

  Object.assign(editor, {
    screenCenterOffset,
    screenCenter,
  })
})

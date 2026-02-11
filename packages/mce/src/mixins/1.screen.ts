import type { ComputedRef } from 'vue'
import { computed } from 'vue'
import { defineMixin } from '../mixin'

declare global {
  namespace Mce {
    interface ViewportConfig {
      screenPadding: ScreenPadding
    }

    interface ScreenPadding {
      left: number
      top: number
      right: number
      bottom: number
    }

    interface Editor {
      screenControlsOffset: ComputedRef<Required<ScreenPadding>>
      screenCenterOffset: ComputedRef<Required<ScreenPadding>>
      screenCenter: ComputedRef<{ x: number, y: number }>
    }
  }
}

export default defineMixin((editor) => {
  const {
    config,
    drawboardAabb,
    registerConfig,
  } = editor

  const screenPadding = registerConfig('viewport.screenPadding', {
    default: { left: 0, top: 0, bottom: 0, right: 0 },
  })

  const screenControlsOffset = computed(() => {
    const offset = {
      left: 0,
      top: 0,
      bottom: 0,
      right: 0,
    }
    if (config.value.ui.ruler.visible) {
      offset.left += 16
      offset.top += 16
    }
    if (config.value.ui.scrollbar.visible) {
      offset.right += 8
      offset.bottom += 8
    }
    return offset
  })

  const screenCenterOffset = computed(() => {
    const _screenControlsOffset = screenControlsOffset.value
    const offset = { ...screenPadding.value }
    offset.left += _screenControlsOffset.left
    offset.top += _screenControlsOffset.top
    offset.right += _screenControlsOffset.right
    offset.bottom += _screenControlsOffset.bottom
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
    screenControlsOffset,
    screenCenterOffset,
    screenCenter,
  })
})

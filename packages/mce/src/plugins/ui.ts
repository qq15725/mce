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
    config,
  } = editor

  return {
    name: 'ui',
    commands: [
      { command: 'ruler', handle: () => config.value.ruler = !config.value.ruler },
      { command: 'scrollbar', handle: () => config.value.scrollbar = !config.value.scrollbar },
      { command: 'bottombar', handle: () => config.value.bottombar = !config.value.bottombar },
      { command: 'statusbar', handle: () => config.value.statusbar = !config.value.statusbar },
      { command: 'timeline', handle: () => config.value.timeline = !config.value.timeline },
    ],
    hotkeys: [
      { command: 'ruler', key: 'Shift+r' },
    ],
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

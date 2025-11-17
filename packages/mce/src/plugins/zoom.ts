import { useResizeObserver } from '@vueuse/core'
import { watch } from 'vue'
import { definePlugin } from '../plugin'

declare global {
  namespace Mce {
    interface Commands {
      zoomIn: () => void
      zoomOut: () => void
      zoomTo100: () => void
      zoomToFit: () => void
      zoomToCover: () => void
      zoomToSelection: (options?: ZoomToOptions) => void
    }

    interface Hotkeys {
      zoomIn: [event: KeyboardEvent]
      zoomOut: [event: KeyboardEvent]
      zoomTo100: [event: KeyboardEvent]
      zoomToFit: [event: KeyboardEvent]
      zoomToCover: [event: KeyboardEvent]
      zoomToSelection: [event: KeyboardEvent]
    }

    interface Editor {
      //
    }
  }
}

export default definePlugin((editor) => {
  const {
    camera,
    drawboardAabb,
    zoomTo,
    elementSelection,
    exec,
  } = editor

  return {
    name: 'mce:zoom',
    commands: [
      { command: 'zoomIn', handle: () => camera.value.addZoom(0.25) },
      { command: 'zoomOut', handle: () => camera.value.addZoom(-0.25) },
      { command: 'zoomTo100', handle: () => camera.value.setZoom(1) },
      { command: 'zoomToCover', handle: () => zoomTo('root', { mode: 'cover' }) },
      { command: 'zoomToFit', handle: () => zoomTo('root', { mode: 'contain' }) },
      { command: 'zoomToSelection', handle: options => zoomTo('selection', options) },
    ],
    hotkeys: [
      { command: 'zoomIn', key: 'CmdOrCtrl+=' },
      { command: 'zoomOut', key: 'CmdOrCtrl+-' },
      { command: 'zoomTo100', key: 'CmdOrCtrl+º' },
      { command: 'zoomToFit', key: 'Shift+¡' },
      { command: 'zoomToSelection', key: 'Shift+™' },
    ],
    events: {
      setDoc: () => exec('zoomToFit'),
      setCurrentFrame: () => {
        if (elementSelection.value.length) {
          exec('zoomToSelection')
        }
        else {
          exec('zoomToFit')
        }
      },
    },
    setup: () => {
      const {
        drawboardDom,
        config,
      } = editor

      watch(() => config.value.viewMode, () => exec('zoomToFit'))

      useResizeObserver(drawboardDom, (entries) => {
        const { left: _left, top: _top, width, height } = entries[0].contentRect
        const { left = _left, top = _top } = drawboardDom.value?.getBoundingClientRect() ?? {}
        drawboardAabb.value = { left, top, width, height }
        exec('zoomToFit')
      })
    },
  }
})

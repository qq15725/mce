import { useResizeObserver } from '@vueuse/core'
import { Aabb2D } from 'modern-canvas'
import { definePlugin } from '../plugin'

declare global {
  namespace Mce {
    interface Config {
      zoomToFit: ZoomToMode
    }

    interface Commands {
      zoomIn: () => void
      zoomOut: () => void
      zoomTo100: () => void
      zoomToFit: () => void
      zoomToSelection: (options?: ZoomToOptions) => void
    }

    interface Hotkeys {
      zoomIn: [event: KeyboardEvent]
      zoomOut: [event: KeyboardEvent]
      zoomTo100: [event: KeyboardEvent]
      zoomToFit: [event: KeyboardEvent]
      zoomToSelection: [event: KeyboardEvent]
    }

    interface Editor {
      //
    }
  }
}

export default definePlugin((editor) => {
  const {
    registerConfig,
    camera,
    drawboardAabb,
    zoomTo,
    exec,
    config,
    findFrame,
    selection,
  } = editor

  registerConfig('zoomToFit', 'contain')

  function zoomToFrame(type: 'next' | 'previous', options: Mce.ZoomToOptions) {
    const value = findFrame(type)
    if (value) {
      selection.value = [value]
      zoomTo(value, options)
    }
  }

  return {
    name: 'mce:zoom',
    commands: [
      { command: 'zoomIn', handle: () => camera.value.addZoom(0.25) },
      { command: 'zoomOut', handle: () => camera.value.addZoom(-0.25) },
      { command: 'zoomTo100', handle: () => camera.value.setZoom(1) },
      { command: 'zoomToFit', handle: () => zoomTo('root', { mode: config.value.zoomToFit }) },
      { command: 'zoomToSelection', handle: options => zoomTo('selection', options) },
      { command: 'zoomToNextFrame', handle: options => zoomToFrame('next', options) },
      { command: 'zoomToPreviousFrame', handle: options => zoomToFrame('previous', options) },
    ],
    hotkeys: [
      { command: 'zoomIn', key: 'CmdOrCtrl+=' },
      { command: 'zoomOut', key: 'CmdOrCtrl+-' },
      { command: 'zoomTo100', key: 'CmdOrCtrl+0' },
      { command: 'zoomToFit', key: 'Shift+!' },
      { command: 'zoomToSelection', key: 'Shift+@' },
      { command: 'zoomToNextFrame', key: 'n' },
      { command: 'zoomToPreviousFrame', key: 'Shift+N' },
    ],
    events: {
      setDoc: () => exec('zoomToFit'),
    },
    setup: () => {
      const {
        drawboardDom,
      } = editor

      useResizeObserver(drawboardDom, (entries) => {
        const { left: _left, top: _top, width, height } = entries[0].contentRect
        const { left = _left, top = _top } = drawboardDom.value?.getBoundingClientRect() ?? {}
        drawboardAabb.value = new Aabb2D(left, top, width, height)
        exec('zoomToFit')
      })
    },
  }
})

import { useResizeObserver } from '@vueuse/core'
import { watch } from 'vue'
import { defineProvider } from '../editor'

declare global {
  namespace Mce {
    interface Commands {
      zoomIn: () => void
      zoomOut: () => void
      zoomTo100: () => void
      zoomToFit: () => void
      zoomToCover: () => void
      zoomToSelection: () => void
    }

    interface Hotkeys {
      zoomIn: [event: KeyboardEvent]
      zoomOut: [event: KeyboardEvent]
      zoomTo100: [event: KeyboardEvent]
      zoomToFit: [event: KeyboardEvent]
      zoomToCover: [event: KeyboardEvent]
      zoomToSelection: [event: KeyboardEvent]
    }

    interface Config {
      zoomToFitOffset: number
    }

    interface Editor {
      //
    }
  }
}

export default defineProvider((editor) => {
  const {
    registerHotkey,
    registerCommand,
    camera,
    log,
    drawboardAabb,
    viewAabb,
    config,
    registerConfig,
  } = editor

  registerConfig('zoomToFitOffset', 0)

  registerCommand([
    { key: 'zoomIn', handle: zoomIn },
    { key: 'zoomOut', handle: zoomOut },
    { key: 'zoomTo100', handle: zoomTo100 },
    { key: 'zoomToFit', handle: zoomToFit },
    { key: 'zoomToCover', handle: zoomToCover },
    { key: 'zoomToSelection', handle: zoomToSelection },
  ])

  registerHotkey([
    { key: 'zoomIn', accelerator: 'CmdOrCtrl+=' },
    { key: 'zoomOut', accelerator: 'CmdOrCtrl+-' },
    { key: 'zoomTo100', accelerator: 'Alt+º' },
    { key: 'zoomToFit', accelerator: 'Alt+¡' },
    { key: 'zoomToCover', accelerator: 'Alt+™' },
    { key: 'zoomToSelection', accelerator: 'Alt+™' },
  ])

  function zoomIn(): void {
    camera.value.addZoom(0.25)
  }

  function zoomOut(): void {
    camera.value.addZoom(-0.25)
  }

  function zoomTo100(): void {
    camera.value.setZoom(1)
  }

  function _zoomToFit(mode: 'contain' | 'cover' = 'contain'): void {
    // TODO 可能转移至实例
    const offset = config.value.zoomToFitOffset
    const tw = drawboardAabb.value.width - offset
    const th = drawboardAabb.value.height - offset
    const sw = viewAabb.value.width
    const sh = viewAabb.value.height
    if (sw && sh) {
      const zw = tw / sw
      const zh = th / sh
      camera.value.setZoom(
        mode === 'contain'
          ? Math.min(zw, zh)
          : Math.max(zw, zh),
      )
      const zoom = camera.value.zoom.x
      let x = offset / 2
      let y = offset / 2
      if (zw < zh) {
        y += (th - sh * zoom) / 2
      }
      else {
        x += (tw - sw * zoom) / 2
      }
      camera.value.position.set(
        -viewAabb.value.left * zoom + x,
        -viewAabb.value.top * zoom + y,
      )
    }
  }

  function zoomToFit(): void {
    _zoomToFit()
  }

  function zoomToCover(): void {
    _zoomToFit('cover')
  }

  function zoomToSelection(): void {
    log('TODO zoomToSelection')
  }

  return () => {
    const {
      drawboardDom,
      on,
      config,
    } = editor

    on('setDoc', zoomToFit)
    on('setActiveFrame', zoomToFit)
    watch(() => config.value.viewMode, zoomToFit)

    useResizeObserver(drawboardDom, (entries) => {
      const { left: _left, top: _top, width, height } = entries[0].contentRect
      const { left = _left, top = _top } = drawboardDom.value?.getBoundingClientRect() ?? {}
      drawboardAabb.value = { left, top, width, height }
      zoomToFit()
    })
  }
})

import { useResizeObserver } from '@vueuse/core'
import { watch } from 'vue'
import { definePlugin } from '../editor'

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

export default definePlugin((editor) => {
  const {
    registerHotkey,
    registerCommand,
    camera,
    drawboardAabb,
    viewAabb,
    config,
    currentAabb,
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

  // TODO 可能转移至实例
  function _zoomToFit(
    mode: 'contain' | 'cover',
    selection = false,
  ): void {
    const targetAabb = selection
      ? currentAabb.value
      : viewAabb.value
    const offset = { x: 0, y: 0 }
    offset.x += config.value.zoomToFitOffset
    offset.y += config.value.zoomToFitOffset
    if (config.value.scrollbar) {
      offset.x += 16
      offset.y += 16
    }
    if (config.value.ruler) {
      offset.x += 16
      offset.y += 16
    }
    const tw = drawboardAabb.value.width - offset.x
    const th = drawboardAabb.value.height - offset.y
    const sx = targetAabb.left
    const sy = targetAabb.top
    const sw = targetAabb.width
    const sh = targetAabb.height
    if (sw && sh) {
      const zw = tw / sw
      const zh = th / sh
      camera.value.setZoom(
        mode === 'contain'
          ? Math.min(zw, zh)
          : Math.max(zw, zh),
      )
      const zoom = camera.value.zoom.x
      let x = offset.x / 2
      let y = offset.y / 2
      if (zw < zh) {
        y += (th - sh * zoom) / 2
      }
      else {
        x += (tw - sw * zoom) / 2
      }
      camera.value.position.set(
        (-sx * zoom + x),
        (-sy * zoom + y),
      )
    }
  }

  function zoomToFit(): void {
    _zoomToFit('contain')
  }

  function zoomToCover(): void {
    _zoomToFit('cover')
  }

  function zoomToSelection(): void {
    _zoomToFit('contain', true)
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

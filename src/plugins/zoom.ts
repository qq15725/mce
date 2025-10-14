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
      zoomToFitOffset: {
        left?: number
        top?: number
        right?: number
        bottom?: number
      }
    }

    interface Editor {
      //
    }
  }
}

const defaultZoomToFitOffset = { left: 0, top: 0, bottom: 0, right: 0 }

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

  registerConfig('zoomToFitOffset', { ...defaultZoomToFitOffset })

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
    const offset = {
      ...defaultZoomToFitOffset,
      ...config.value.zoomToFitOffset,
    }
    if (config.value.scrollbar) {
      offset.right += 16
      offset.bottom += 16
    }
    if (config.value.ruler) {
      offset.left += 16
      offset.top += 16
    }
    const tw = drawboardAabb.value.width - (offset.left + offset.right)
    const th = drawboardAabb.value.height - (offset.top + offset.bottom)
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
      let x = offset.left
      let y = offset.top
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
      currentElements,
    } = editor

    on('setDoc', zoomToFit)
    on('setActiveFrame', () => {
      if (currentElements.value.length) {
        zoomToSelection()
      }
      else {
        zoomToFit()
      }
    })
    watch(() => config.value.viewMode, zoomToFit)

    useResizeObserver(drawboardDom, (entries) => {
      const { left: _left, top: _top, width, height } = entries[0].contentRect
      const { left = _left, top = _top } = drawboardDom.value?.getBoundingClientRect() ?? {}
      drawboardAabb.value = { left, top, width, height }
      zoomToFit()
    })
  }
})

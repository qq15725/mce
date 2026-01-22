import type { Aabb2D, Element2D } from 'modern-canvas'
import { clamp } from 'modern-canvas'
import { definePlugin } from '../plugin'

declare global {
  namespace Mce {
    type ZoomTarget
      = | 'root'
        | 'selection'
        | Element2D
        | Element2D[]
        | number

    type ZoomToMode
      = | 'contain'
        | 'cover'
        | 'width'
        | 'height'

    interface ZoomToOptions {
      intoView?: boolean
      mode?: ZoomToMode
      duration?: number
      behavior?: 'smooth' | 'instant'
    }

    interface Config {
      zoomToFit: ZoomToMode
    }

    interface Commands {
      zoomIn: () => void
      zoomOut: () => void
      zoomTo: (target: ZoomTarget, options?: ZoomToOptions) => Promise<void>
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
  }
}

export default definePlugin((editor) => {
  const {
    registerConfig,
    camera,
    exec,
    config,
    findFrame,
    selection,
    drawboardAabb,
    selectionAabb,
    rootAabb,
    getAabb,
    screenCenterOffset,
    viewportAabb,
  } = editor

  registerConfig('zoomToFit', 'contain')

  async function zoomTo(target: Mce.ZoomTarget, options: Mce.ZoomToOptions = {}) {
    const {
      intoView,
      mode = 'contain',
      duration = 500,
      behavior,
    } = options

    let aabb: Aabb2D
    if (Array.isArray(target) || typeof target === 'object') {
      aabb = getAabb(target)
    }
    else {
      switch (target) {
        case 'selection':
          aabb = selectionAabb.value
          break
        case 'root':
        default:
          aabb = rootAabb.value
          break
      }
    }

    if (intoView && viewportAabb.value.contains(aabb)) {
      return
    }

    const offset = screenCenterOffset.value
    const { width, height } = drawboardAabb.value
    const tw = width - (offset.left + offset.right)
    const th = height - (offset.top + offset.bottom)
    const [sx, sy, sw, sh] = aabb.toArray()

    if (!sw || !sh)
      return

    const zw = tw / sw
    const zh = th / sh

    const _camera = camera.value

    let targetZoom
    if (typeof target === 'number') {
      targetZoom = target
    }
    else {
      switch (mode) {
        case 'width':
          targetZoom = zw
          break
        case 'height':
          targetZoom = zh
          break
        case 'cover':
          targetZoom = Math.max(zw, zh)
          break
        case 'contain':
        default:
          targetZoom = Math.min(zw, zh)
          break
      }
    }

    const oldZoom = Math.min(_camera.zoom.x, _camera.zoom.y)
    const newZoom = Math.min(
      clamp(targetZoom, _camera.minZoom.x, _camera.maxZoom.x),
      clamp(targetZoom, _camera.minZoom.y, _camera.maxZoom.y),
    )

    let x = offset.left
    let y = offset.top
    if (zw < zh) {
      y += (th - sh * newZoom) / 2
    }
    else {
      x += (tw - sw * newZoom) / 2
    }
    const oldPosition = {
      x: _camera.position.x,
      y: _camera.position.y,
    }
    const newPosition = {
      x: sx * newZoom - x,
      y: sy * newZoom - y,
    }

    switch (behavior) {
      case 'smooth':
        await new Promise<void>((resolve) => {
          const zoomDistance = newZoom - oldZoom
          const positionDistance = {
            x: newPosition.x - oldPosition.x,
            y: newPosition.y - oldPosition.y,
          }
          const startTime = performance.now()
          function step(now: number) {
            const elapsed = now - startTime
            const progress = Math.min(elapsed / duration, 1)
            const ease = progress < 0.5
              ? 2 * progress * progress
              : -1 + (4 - 2 * progress) * progress // easeInOutQuad

            _camera.zoom.set(oldZoom + zoomDistance * ease)
            _camera.position.set(
              oldPosition.x + positionDistance.x * ease,
              oldPosition.y + positionDistance.y * ease,
            )

            if (elapsed < duration) {
              requestAnimationFrame(step)
            }
            else {
              resolve()
            }
          }
          requestAnimationFrame(step)
        })
        break
      case 'instant':
      default:
        _camera.zoom.set(newZoom)
        _camera.position.set(newPosition.x, newPosition.y)
        break
    }
  }

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
      { command: 'zoomTo', handle: zoomTo },
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
      { command: 'zoomToFit', key: 'Shift+1' },
      { command: 'zoomToSelection', key: 'Shift+2' },
      { command: 'zoomToNextFrame', key: 'N' },
      { command: 'zoomToPreviousFrame', key: 'Shift+N' },
    ],
    events: {
      setDoc: () => {
        console.log('setDoc')

        exec('zoomToFit')
      },
    },
  }
})

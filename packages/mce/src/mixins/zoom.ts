import type { Aabb2D, Element2D } from 'modern-canvas'
import { clamp } from 'modern-canvas'
import { defineMixin } from '../mixin'

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

    interface Editor {
      zoomTo: (target: ZoomTarget, options?: ZoomToOptions) => Promise<void>
    }
  }
}

export default defineMixin((editor) => {
  const {
    camera,
    drawboardAabb,
    selectionAabb,
    rootAabb,
    getAabb,
    screenCenterOffset,
    viewportAabb,
  } = editor

  const zoomTo: Mce.Editor['zoomTo'] = async (target, options = {}) => {
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

  Object.assign(editor, {
    zoomTo,
  })
})

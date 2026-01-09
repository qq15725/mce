import type { Element2D } from 'modern-canvas'
import type { AxisAlignedBoundingBox } from '../types'
import { clamp } from 'modern-canvas'
import { defineMixin } from '../mixin'

declare global {
  namespace Mce {
    type ZoomTarget
      = | 'root'
        | 'selection'
        | Element2D[]
        | number

    type ZoomToMode
      = | 'contain'
        | 'cover'

    interface ZoomToOptions {
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
    viewAabb,
    getAabb,
    screenCenterOffset,
  } = editor

  const zoomTo: Mce.Editor['zoomTo'] = async (target, options = {}) => {
    const {
      mode = 'contain',
      duration = 500,
      behavior,
    } = options

    let aabb: AxisAlignedBoundingBox
    if (Array.isArray(target)) {
      aabb = getAabb(target)
    }
    else {
      switch (target) {
        case 'selection':
          aabb = selectionAabb.value
          break
        case 'root':
        default:
          aabb = viewAabb.value
          break
      }
    }

    const offset = screenCenterOffset.value
    const { width, height } = drawboardAabb.value
    const tw = width - (offset.left + offset.right)
    const th = height - (offset.top + offset.bottom)
    const sx = aabb.left
    const sy = aabb.top
    const sw = aabb.width
    const sh = aabb.height

    if (!sw || !sh)
      return

    const zw = tw / sw
    const zh = th / sh

    const _camera = camera.value

    let targetZoom
    if (typeof target === 'number') {
      targetZoom = target
    }
    else if (mode === 'cover') {
      targetZoom = Math.max(zw, zh)
    }
    else {
      targetZoom = Math.min(zw, zh)
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

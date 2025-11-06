import type { Element2D } from 'modern-canvas'
import type { AxisAlignedBoundingBox } from '../types'
import { clamp } from 'modern-canvas'
import { defineMixin } from '../editor'

declare global {
  namespace Mce {
    interface Config {
      zoomRectOffset: {
        left?: number
        top?: number
        right?: number
        bottom?: number
      }
    }

    type ZoomToValue = 'contain' | 'cover' | number

    interface ZoomToOptions {
      selection?: boolean | Element2D[]
      behavior?: 'smooth' | 'instant'
    }

    interface Editor {
      zoomTo: (value: ZoomToValue, options?: ZoomToOptions) => Promise<void>
    }
  }
}

const zoomRectOffset = { left: 0, top: 0, bottom: 0, right: 0 }

export default defineMixin((editor) => {
  const {
    camera,
    registerConfig,
    config,
    drawboardAabb,
    currentAabb,
    viewAabb,
    getAabb,
  } = editor

  registerConfig('zoomRectOffset', { ...zoomRectOffset })

  function getZoomRectOffset() {
    const offset = {
      ...zoomRectOffset,
      ...config.value.zoomRectOffset,
    }
    if (config.value.scrollbar) {
      offset.right += 8
      offset.bottom += 8
    }
    if (config.value.ruler) {
      offset.left += 16
      offset.top += 16
    }
    return offset
  }

  const zoomTo: Mce.Editor['zoomTo'] = async (value, options = {}) => {
    const {
      selection,
      behavior,
    } = options

    let aabb: AxisAlignedBoundingBox
    if (Array.isArray(selection)) {
      aabb = getAabb(selection)
    }
    else if (selection) {
      aabb = currentAabb.value
    }
    else {
      aabb = viewAabb.value
    }

    const offset = getZoomRectOffset()
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
    if (value === 'contain') {
      targetZoom = Math.min(zw, zh)
    }
    else if (value === 'cover') {
      targetZoom = Math.max(zw, zh)
    }
    else {
      targetZoom = value
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
      x: (-sx * newZoom + x),
      y: (-sy * newZoom + y),
    }

    const duration = 500

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
              : -1 + (4 - 2 * progress) * progress // 示例的 easeInOutQuad

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

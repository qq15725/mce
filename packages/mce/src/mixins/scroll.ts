import type { Element2D } from 'modern-canvas'
import { defineMixin } from '../mixin'

declare global {
  namespace Mce {
    type ScrollTarget
      = | 'root'
        | 'selection'
        | { x: number }
        | { y: number }
        | { x: number, y: number }
        | Element2D[]

    interface ScrollToOptions {
      intoView?: boolean
      duration?: number
      behavior?: 'smooth' | 'instant'
    }

    interface Editor {
      scrollTo: (target: ScrollTarget, options?: ScrollToOptions) => Promise<void>
    }
  }
}

export default defineMixin((editor) => {
  const {
    camera,
    getAabb,
    selectionAabb,
    rootAabb,
    viewportAabb,
    screenCenter,
    screenCenterOffset,
  } = editor

  const scrollTo: Mce.Editor['scrollTo'] = async (target, options = {}) => {
    const {
      intoView,
      behavior,
      duration = 500,
    } = options

    const _camera = camera.value
    const { position: _position, zoom } = _camera
    const oldPosition = { x: _position.x, y: _position.y }
    const _screenCenter = screenCenter.value
    const offset = { x: 0, y: 0 }
    let targetPosition: { x?: number, y?: number } = {}
    if (typeof target === 'object') {
      if ('x' in target) {
        targetPosition.x = target.x
        offset.x = -screenCenterOffset.value.left
      }
      if ('y' in target) {
        targetPosition.y = target.y
        offset.y = -screenCenterOffset.value.top
      }
    }
    else {
      let aabb
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
            aabb = rootAabb.value
            break
        }
      }
      if (intoView && viewportAabb.value.contains(aabb)) {
        return
      }
      targetPosition = { x: aabb.left + aabb.width / 2, y: aabb.top + aabb.height / 2 }
      offset.x += -_screenCenter.x
      offset.y = -_screenCenter.y
    }

    if (targetPosition.x !== undefined) {
      targetPosition.x *= zoom.x
      targetPosition.x += offset.x
    }

    if (targetPosition.y !== undefined) {
      targetPosition.y *= zoom.y
      targetPosition.y += offset.y
    }

    const position = {
      ...oldPosition,
      ...targetPosition,
    }

    switch (behavior) {
      case 'smooth':
        await new Promise<void>((resolve) => {
          const positionDistance = {
            x: position.x - oldPosition.x,
            y: position.y - oldPosition.y,
          }
          const startTime = performance.now()
          function step(now: number) {
            const elapsed = now - startTime
            const progress = Math.min(elapsed / duration, 1)
            const ease = progress < 0.5
              ? 2 * progress * progress
              : -1 + (4 - 2 * progress) * progress // easeInOutQuad

            _position.set(
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
        _position.set(position.x, position.y)
        break
    }
  }

  Object.assign(editor, {
    scrollTo,
  })
})

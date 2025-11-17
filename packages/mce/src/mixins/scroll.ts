import type { Element2D } from 'modern-canvas'
import { defineMixin } from '../mixin'

declare global {
  namespace Mce {
    type ScrollTarget
      = | 'root'
        | 'selection'
        | { x: number, y: number }
        | Element2D[]

    interface ScrollToOptions {
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
    viewAabb,
    screenCenter,
  } = editor

  const scrollTo: Mce.Editor['scrollTo'] = async (target, options = {}) => {
    const {
      behavior,
      duration = 500,
    } = options

    const _camera = camera.value

    const _screenCenter = screenCenter.value
    const offset = { x: 0, y: 0 }
    let position = { x: 0, y: 0 }
    if (typeof target === 'object' && 'x' in target && 'y' in target) {
      position.x = target.x
      position.y = target.y
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
            aabb = viewAabb.value
            break
        }
      }
      position = { x: aabb.left + aabb.width / 2, y: aabb.top + aabb.height / 2 }
      offset.x += -_screenCenter.x
      offset.y = -_screenCenter.y
    }

    position.x *= _camera.zoom.x
    position.x += offset.x
    position.y *= _camera.zoom.y
    position.y += offset.y

    const oldPosition = { x: _camera.position.x, y: _camera.position.y }

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
        _camera.position.set(position.x, position.y)
        break
    }
  }

  Object.assign(editor, {
    scrollTo,
  })
})

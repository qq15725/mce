import type { Element2D } from 'modern-canvas'
import { defineMixin } from '../editor'

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
    currentAabb,
    viewAabb,
  } = editor

  const scrollTo: Mce.Editor['scrollTo'] = async (target, options = {}) => {
    const {
      behavior,
      duration = 500,
    } = options

    let position: { x: number, y: number }
    if (Array.isArray(target)) {
      const aabb = getAabb(target)
      position = { x: aabb.left, y: aabb.top }
    }
    else if (target === 'selection') {
      const aabb = currentAabb.value
      position = { x: aabb.left, y: aabb.top }
    }
    else if (target === 'root') {
      const aabb = viewAabb.value
      position = { x: aabb.left, y: aabb.top }
    }
    else {
      position = target
    }

    const _camera = camera.value
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

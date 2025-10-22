import type { Element2D } from 'modern-canvas'
import { defineMixin } from '../editor'

declare global {
  namespace Mce {
    interface Editor {
      isLocked: (element: Element2D) => boolean
      lock: (element: Element2D) => void
      unlock: (element: Element2D) => void
    }
  }
}

export default defineMixin((editor) => {
  function isLocked(element: Element2D): boolean {
    return Boolean(element.meta.locked)
  }

  function lock(element: Element2D): void {
    element.meta.locked = true
  }

  function unlock(element: Element2D): void {
    element.meta.locked = false
  }

  Object.assign(editor, {
    isLocked,
    lock,
    unlock,
  })
})

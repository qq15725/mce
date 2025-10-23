import type { Element2D } from 'modern-canvas'
import { defineMixin } from '../editor'

declare global {
  namespace Mce {
    interface Editor {
      isLock: (element: Element2D) => boolean
      lock: (element: Element2D) => void
      unlock: (element: Element2D) => void
    }
  }
}

export default defineMixin((editor) => {
  function isLock(element: Element2D): boolean {
    return Boolean(element.meta.lock)
  }

  function lock(element: Element2D): void {
    element.meta.lock = true
  }

  function unlock(element: Element2D): void {
    element.meta.lock = false
  }

  Object.assign(editor, {
    isLock,
    lock,
    unlock,
  })
})

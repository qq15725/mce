import type { Element2D } from 'modern-canvas'
import { defineMixin } from '../editor'

declare global {
  namespace Mce {
    interface Commands {
      'lock': () => void
      'unlock': () => void
      'lock/unlock': () => void
    }

    interface Hotkeys {
      'lock/unlock': [event: KeyboardEvent]
    }

    interface Editor {
      isLocked: (element: Element2D) => boolean
      lock: (element: Element2D) => void
      unlock: (element: Element2D) => void
    }
  }
}

export default defineMixin((editor) => {
  const {
    registerCommand,
    registerHotkey,
    selection,
  } = editor

  registerCommand([
    { command: 'lock', handle: () => selection.value.forEach(lock) },
    { command: 'unlock', handle: () => selection.value.forEach(unlock) },
    { command: 'lock/unlock', handle: () => selection.value.forEach(el => isLocked(el) ? unlock(el) : lock(el)) },
  ])

  registerHotkey([
    { command: 'lock/unlock', key: 'CmdOrCtrl+l', editable: false },
  ])

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

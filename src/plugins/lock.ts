import { definePlugin } from '../editor'

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
  }
}

export default definePlugin((editor) => {
  const {
    currentElements,
    registerHotkey,
    registerCommand,
  } = editor

  registerCommand([
    { key: 'lock', handle: lock },
    { key: 'unlock', handle: unlock },
    { key: 'lock/unlock', handle: lockOrUnlock },
  ])

  registerHotkey([
    { key: 'lock/unlock', accelerator: 'CmdOrCtrl+l', editable: false },
  ])

  function lock() {
    currentElements.value.forEach((el) => {
      el.meta.locked = true
    })
  }

  function unlock() {
    currentElements.value.forEach((el) => {
      el.meta.locked = false
    })
  }

  function lockOrUnlock() {
    currentElements.value.forEach((el) => {
      el.meta.locked = !el.meta.locked
    })
  }
})

import { definePlugin } from '../editor'

declare global {
  namespace Mce {
    interface Commands {
      'hide': () => void
      'show': () => void
      'hide/show': () => void
    }

    interface Hotkeys {
      'hide/show': [event: KeyboardEvent]
    }
  }
}

export default definePlugin((editor) => {
  const {
    registerHotkey,
    registerCommand,
    currentElements,
  } = editor

  registerCommand([
    { key: 'hide', handle: hide },
    { key: 'show', handle: show },
    { key: 'hide/show', handle: hideOrShow },
  ])

  registerHotkey([
    { key: 'hide/show', accelerator: 'CmdOrCtrl+h' },
  ])

  function show(): void {
    currentElements.value.forEach((el) => {
      el.style.visibility = 'visible'
    })
  }

  function hide(): void {
    currentElements.value.forEach((el) => {
      el.style.visibility = 'hidden'
    })
  }

  function hideOrShow(): void {
    currentElements.value.forEach((el) => {
      el.style.visibility = el.style.visibility === 'hidden' ? 'visible' : 'hidden'
    })
  }
})

import { definePlugin } from '../editor'

declare global {
  namespace Mce {
    interface Hotkeys {
      'hide/show': [event: KeyboardEvent]
    }

    interface Commands {
      'hide/show': () => void
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
    { key: 'hide/show', handle: hideOrShow },
  ])

  registerHotkey([
    { key: 'hide/show', accelerator: 'CmdOrCtrl+h' },
  ])

  function hideOrShow(): void {
    currentElements.value.forEach((el) => {
      el.visible = !el.visible
    })
  }
})

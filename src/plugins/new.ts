import { definePlugin } from '../editor'

declare global {
  namespace Mce {
    interface Commands {
      new: () => void
    }

    interface Hotkeys {
      new: [event: KeyboardEvent]
    }
  }
}

export default definePlugin((editor) => {
  const {
    registerCommand,
    registerHotkey,
    setDoc,
  } = editor

  registerCommand([
    { key: 'new', handle: _new },
  ])

  registerHotkey([
    { key: 'new', accelerator: 'Alt+CmdOrCtrl+Dead' },
  ])

  function _new() {
    setDoc({
      style: {
        width: 1920,
        height: 1080,
      },
      children: [],
    })
  }
})

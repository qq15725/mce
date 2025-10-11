import { definePlugin } from '../editor'

declare global {
  namespace Mce {
    interface Commands {
      'frame': () => void
      'unframe': () => void
      'frame/unframe': () => void
    }

    interface Hotkeys {
      'frame/unframe': [event: KeyboardEvent]
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
    { key: 'frame', handle: frame },
    { key: 'unframe', handle: unframe },
    { key: 'frame/unframe', handle: frameOrUnframe },
  ])

  registerHotkey([
    { key: 'frame/unframe', accelerator: 'CmdOrCtrl+f', editable: false },
  ])

  function frame(): void {
    currentElements.value.forEach((el) => {
      el.meta.inEditorIs = 'Frame'
    })
  }

  function unframe() {
    currentElements.value.forEach((el) => {
      el.meta.inEditorIs = 'Element'
    })
  }

  function frameOrUnframe() {
    currentElements.value.forEach((el) => {
      el.meta.inEditorIs = el.meta.inEditorIs === 'Frame' ? 'Element' : 'Frame'
    })
  }
})

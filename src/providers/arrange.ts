import { defineProvider } from '../editor'

declare global {
  namespace Mce {
    interface Hotkeys {
      raiseToFront: [event: KeyboardEvent]
      raise: [event: KeyboardEvent]
      lower: [event: KeyboardEvent]
      lowerToBack: [event: KeyboardEvent]
    }

    interface Commands {
      raiseToFront: () => void
      raise: () => void
      lower: () => void
      lowerToBack: () => void
      reverse: () => void
    }
  }
}

export default defineProvider((editor) => {
  const {
    registerCommand,
    registerHotkey,
  } = editor

  registerCommand([
    { key: 'raiseToFront', handle: raiseToFront },
    { key: 'raise', handle: raise },
    { key: 'lower', handle: lower },
    { key: 'lowerToBack', handle: lowerToBack },
    { key: 'reverse', handle: reverse },
  ])

  registerHotkey([
    { key: 'raiseToFront', accelerator: 'Shift+CmdOrCtrl+]' },
    { key: 'raise', accelerator: 'CmdOrCtrl+]' },
    { key: 'lower', accelerator: 'CmdOrCtrl+[' },
    { key: 'lowerToBack', accelerator: 'Shift+CmdOrCtrl+[' },
  ])

  function raiseToFront(): void {
    // TODO
  }

  function raise(): void {
    // TODO
  }

  function lower(): void {
    // TODO
  }

  function lowerToBack(): void {
    // TODO
  }

  function reverse(): void {
    // TODO
  }
})

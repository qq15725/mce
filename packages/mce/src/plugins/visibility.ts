import { definePlugin } from '../plugin'

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
    elementSelection,
    setVisible,
    isVisible,
  } = editor

  function show(): void {
    elementSelection.value.forEach((el) => {
      setVisible(el, true)
    })
  }

  function hide(): void {
    elementSelection.value.forEach((el) => {
      setVisible(el, false)
    })
  }

  function hideOrShow(): void {
    elementSelection.value.forEach((el) => {
      setVisible(el, !isVisible(el))
    })
  }

  return {
    name: 'mce:visibility',
    commands: [
      { command: 'hide', handle: hide },
      { command: 'show', handle: show },
      { command: 'hide/show', handle: hideOrShow },
    ],
    hotkeys: [
      { command: 'hide/show', key: 'Shift+CmdOrCtrl+h' },
    ],
  }
})

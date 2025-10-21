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
    selection,
  } = editor

  function show(): void {
    selection.value.forEach((el) => {
      el.style.visibility = 'visible'
    })
  }

  function hide(): void {
    selection.value.forEach((el) => {
      el.style.visibility = 'hidden'
    })
  }

  function hideOrShow(): void {
    selection.value.forEach((el) => {
      el.style.visibility = el.style.visibility === 'hidden' ? 'visible' : 'hidden'
    })
  }

  return {
    name: 'visibility',
    commands: {
      'hide': hide,
      'show': show,
      'hide/show': hideOrShow,
    },
    hotkeys: [
      { key: 'hide/show', accelerator: 'CmdOrCtrl+h' },
    ],
  }
})

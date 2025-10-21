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
    setDoc,
  } = editor

  function _new() {
    setDoc({
      style: {
        width: 1920,
        height: 1080,
      },
      children: [],
    })
  }

  return {
    name: 'new',
    commands: {
      new: _new,
    },
    hotkeys: [
      { key: 'new', accelerator: 'Alt+CmdOrCtrl+Dead' },
    ],
  }
})

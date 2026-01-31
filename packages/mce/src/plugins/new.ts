import { definePlugin } from '../plugin'

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
    exec,
  } = editor

  function _new() {
    exec('setDoc', [])
  }

  return {
    name: 'mce:new',
    commands: [
      { command: 'new', handle: _new },
    ],
    hotkeys: [
      { command: 'new', key: 'Alt+CmdOrCtrl+Dead' },
    ],
  }
})

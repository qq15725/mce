import { idGenerator } from 'modern-idoc'
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
      id: idGenerator(),
      children: [],
    })
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

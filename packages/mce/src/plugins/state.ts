import { definePlugin } from '../plugin'

declare global {
  namespace Mce {
    interface Commands {
      setState: (val: State) => void
    }
  }
}

export default definePlugin((editor) => {
  const {
    state,
  } = editor

  return {
    name: 'mce:state',
    commands: [
      { command: 'setState', handle: val => state.value = val },
    ],
    hotkeys: [
      { command: 'setState:move', key: 'v' },
      { command: 'setState:hand', key: 'h' },
    ],
  }
})

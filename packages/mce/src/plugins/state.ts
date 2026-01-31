import { definePlugin } from '../plugin'

declare global {
  namespace Mce {
    interface Commands {
      getState: () => State
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
      { command: 'getState', handle: () => state.value },
      { command: 'setState', handle: val => state.value = val },
    ],
    hotkeys: [
      { command: 'setState:move', key: 'V' },
      { command: 'setState:hand', key: 'H' },
    ],
  }
})

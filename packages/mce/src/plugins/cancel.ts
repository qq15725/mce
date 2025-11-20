import { definePlugin } from '../plugin'

declare global {
  namespace Mce {
    interface Commands {
      cancel: () => void
    }
  }
}

export default definePlugin((editor) => {
  const {
    state,
  } = editor

  function cancel() {
    state.value = undefined
  }

  return {
    name: 'mce:cancel',
    commands: [
      { command: 'cancel', handle: cancel },
    ],
    hotkeys: [
      { command: 'cancel', key: 'escape', editable: false },
    ],
  }
})

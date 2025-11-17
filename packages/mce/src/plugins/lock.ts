import { definePlugin } from '../plugin'

declare global {
  namespace Mce {
    interface Commands {
      'lock': () => void
      'unlock': () => void
      'lock/unlock': () => void
    }

    interface Hotkeys {
      'lock/unlock': [event: KeyboardEvent]
    }
  }
}

export default definePlugin((editor) => {
  const {
    selection,
    isLock,
    setLock,
  } = editor

  return {
    name: 'mce:lock',
    commands: [
      { command: 'lock', handle: () => selection.value.forEach(el => setLock(el, true)) },
      { command: 'unlock', handle: () => selection.value.forEach(el => setLock(el, false)) },
      { command: 'lock/unlock', handle: () => selection.value.forEach(el => setLock(el, !isLock(el))) },
    ],
    hotkeys: [
      { command: 'lock/unlock', key: 'Shift+CmdOrCtrl+l' },
    ],
  }
})

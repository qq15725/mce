import { definePlugin } from '../editor'

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
    isLocked,
    setLock,
  } = editor

  return {
    name: 'mce:lock',
    commands: [
      { command: 'lock', handle: () => selection.value.forEach(el => setLock(el, true)) },
      { command: 'unlock', handle: () => selection.value.forEach(el => setLock(el, false)) },
      { command: 'lock/unlock', handle: () => selection.value.forEach(el => setLock(el, !isLocked(el))) },
    ],
    hotkeys: [
      { command: 'lock/unlock', key: 'Shift+CmdOrCtrl+l' },
    ],
  }
})

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
    lock,
    unlock,
    isLock,
  } = editor

  return {
    name: 'lock',
    commands: [
      { command: 'lock', handle: () => selection.value.forEach(lock) },
      { command: 'unlock', handle: () => selection.value.forEach(unlock) },
      { command: 'lock/unlock', handle: () => selection.value.forEach(el => isLock(el) ? unlock(el) : lock(el)) },
    ],
    hotkeys: [
      { command: 'lock/unlock', key: 'Shift+CmdOrCtrl+l' },
    ],
  }
})

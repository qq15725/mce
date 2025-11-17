import { definePlugin } from '../plugin'

declare global {
  namespace Mce {
    interface Commands {
      open: () => Promise<void>
    }

    interface Hotkeys {
      open: [event: KeyboardEvent]
    }
  }
}

export default definePlugin((editor) => {
  const {
    openFileDialog,
    loadDoc,
  } = editor

  async function open() {
    const [file] = await openFileDialog()
    if (file) {
      await loadDoc(file)
    }
  }

  return {
    name: 'mce:open',
    commands: [
      { command: 'open', handle: open },
    ],
    hotkeys: [
      { command: 'open', key: 'CmdOrCtrl+o' },
    ],
  }
})

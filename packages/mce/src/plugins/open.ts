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
    exec,
  } = editor

  async function open() {
    const [file] = await openFileDialog()
    if (file) {
      await exec('loadDoc', file)
    }
  }

  return {
    name: 'mce:open',
    commands: [
      { command: 'open', handle: open },
    ],
    hotkeys: [
      { command: 'open', key: 'CmdOrCtrl+O' },
    ],
  }
})

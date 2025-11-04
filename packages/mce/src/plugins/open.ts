import { definePlugin } from '../editor'

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
    load,
    setDoc,
  } = editor

  async function open() {
    const [file] = await openFileDialog()
    if (file) {
      const res = await load(file)
      if (res) {
        if (res.children) {
          setDoc(res)
        }
        else {
          setDoc({
            children: [
              res,
            ],
          })
        }
      }
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

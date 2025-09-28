import { defineProvider } from '../editor'

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

export default defineProvider((editor) => {
  const {
    registerCommand,
    registerHotkey,
    openFileDialog,
    load,
    setDoc,
  } = editor

  registerCommand([
    { key: 'open', handle: open },
  ])

  registerHotkey([
    { key: 'open', accelerator: 'CmdOrCtrl+o' },
  ])

  async function open() {
    const [file] = await openFileDialog()
    if (file) {
      const res = await load(file)
      if (res) {
        if (res.children) {
          setDoc(res)
        }
        else {
          res.style ??= {}
          res.style!.width ??= 1920
          res.style!.height ??= 1080
          setDoc({
            name: 'doc',
            style: {
              width: 1920,
              height: 1080,
            },
            children: [
              {
                name: 'page',
                style: {
                  width: 1920,
                  height: 1080,
                },
                children: [
                  res,
                ],
              },
            ],
          })
        }
      }
    }
  }
})

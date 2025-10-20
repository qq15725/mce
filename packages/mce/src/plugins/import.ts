import type { Element2D } from 'modern-canvas'
import { definePlugin } from '../editor'

declare global {
  namespace Mce {
    interface ImportOptions extends AddElementOptions {
      //
    }

    interface Commands {
      import: (options?: ImportOptions) => Promise<Element2D[]>
    }

    interface Hotkeys {
      import: [event: KeyboardEvent]
    }
  }
}

export default definePlugin((editor) => {
  const {
    registerHotkey,
    registerCommand,
    load,
    openFileDialog,
    addElement,
  } = editor

  registerHotkey([
    { key: 'import', accelerator: 'CmdOrCtrl+i' },
  ])

  registerCommand('import', async (options = {}) => {
    const files = await openFileDialog({ multiple: true })

    return addElement((
      await Promise.all(
        files.map(async (file) => {
          const res = await load(file)
          let elements
          if (res.meta?.inEditorIs === 'Doc') {
            elements = res.children ?? []
          }
          else {
            elements = [res]
          }
          return elements
        }),
      )
    ).flat(), {
      ...options,
      sizeToFit: true,
      positionToFit: true,
    })
  })
})

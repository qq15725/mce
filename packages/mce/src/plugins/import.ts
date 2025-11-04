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
    load,
    openFileDialog,
    addElement,
  } = editor

  const _import: Mce.Commands['import'] = async (options = {}) => {
    const files = await openFileDialog({ multiple: true })

    return addElement(await Promise.all(files.map(file => load(file))), {
      ...options,
      sizeToFit: true,
      positionToFit: true,
    })
  }

  return {
    name: 'mce:import',
    commands: [
      { command: 'import', handle: _import },
    ],
    hotkeys: [
      { command: 'import', key: 'CmdOrCtrl+i' },
    ],
  }
})

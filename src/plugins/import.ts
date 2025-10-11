import type { Vector2Data } from 'modern-canvas'
import { definePlugin } from '../editor'

declare global {
  namespace Mce {
    interface Commands {
      import: (pos: Vector2Data) => Promise<void>
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

  registerCommand([
    { key: 'import', handle: _import },
  ])

  registerHotkey([
    { key: 'import', accelerator: 'CmdOrCtrl+i' },
  ])

  async function _import(pos?: Vector2Data): Promise<void> {
    const files = await openFileDialog({ multiple: true })
    await Promise.all(files.map(async (file) => {
      const res = await load(file)
      if (res) {
        let elements
        if (res.meta?.inEditorIs === 'Doc') {
          elements = res.children ?? []
        }
        else {
          elements = [res]
        }
        if (pos) {
          elements = elements.map((element) => {
            const style = (element.style ?? {}) as Record<string, any>
            return {
              ...element,
              style: {
                ...style,
                left: pos?.x ?? style.left,
                top: pos?.y ?? style.top,
              },
            }
          })
        }
        addElement(
          elements,
          pos
            ? undefined
            : { sizeToFit: true, positionToFit: true },
        )
      }
    }))
  }
})

import type { Vector2Data } from 'modern-canvas'
import { definePlugin } from '../editor'

declare global {
  namespace Mce {
    interface Commands {
      insertImage: () => void
    }
  }
}

export default definePlugin((editor) => {
  const {
    registerCommand,
    setState,
    exec,
  } = editor

  registerCommand([
    {
      key: 'insertImage',
      handle: () => {
        setState('drawing', {
          content: 'image',
          callback: (pos: Vector2Data) => {
            exec('import', pos)
          },
        })
      },
    },
  ])
})

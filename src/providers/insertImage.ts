import type { Vector2Data } from 'modern-canvas'
import { defineProvider } from '../editor'

declare global {
  namespace Mce {
    interface Commands {
      insertImage: () => void
    }
  }
}

export default defineProvider((editor) => {
  const {
    registerCommand,
    setStatus,
    exec,
  } = editor

  registerCommand([
    {
      key: 'insertImage',
      handle: () => {
        setStatus('drawing', {
          content: 'image',
          callback: (pos: Vector2Data) => {
            exec('import', pos)
          },
        })
      },
    },
  ])
})

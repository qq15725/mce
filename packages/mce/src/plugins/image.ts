import type { Element2D, Vector2Data } from 'modern-canvas'
import { definePlugin } from '../editor'
import { createImageElement } from '../utils'

declare global {
  namespace Mce {
    interface InsertImageOptions extends AddElementOptions {
      //
    }

    interface Commands {
      insertImage: (url: string, options?: InsertImageOptions) => Promise<Element2D>
      drawImage: () => void
    }
  }
}

export default definePlugin((editor) => {
  const {
    setState,
    exec,
    addElement,
  } = editor

  return {
    name: 'image',
    commands: {
      insertImage: async (url, options) => {
        return addElement(await createImageElement(url), {
          sizeToFit: true,
          positionToFit: true,
          ...options,
        })
      },
      drawImage: () => {
        setState('drawing', {
          content: 'image',
          callback: (position: Vector2Data) => {
            exec('import', { position })
          },
        })
      },
    },
  }
})

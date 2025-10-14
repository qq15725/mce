import type { Element2D, Vector2Data } from 'modern-canvas'
import { definePlugin } from '../../editor'
import { getImageSizeFromUrl } from '../../utils'

declare global {
  namespace Mce {
    interface InsertImageOptions extends InsertElementOptions {
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
    registerCommand,
    setState,
    exec,
  } = editor

  registerCommand([
    { key: 'drawImage', handle: drawImage },
  ])

  function drawImage() {
    setState('drawing', {
      content: 'image',
      callback: (pos: Vector2Data) => {
        exec('import', pos)
      },
    })
  }

  registerCommand('insertImage', async (url, options) => {
    return exec('insertElement', {
      style: {
        ...await getImageSizeFromUrl(url),
      },
      foreground: {
        image: url,
      },
      meta: {
        inPptIs: 'Picture',
      },
    }, options)
  })
})

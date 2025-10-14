import type { Element2D, Vector2Data } from 'modern-canvas'
import { definePlugin } from '../../editor'
import { getImageSizeFromUrl } from '../../utils'

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
    registerCommand,
    setState,
    exec,
    addElement,
  } = editor

  registerCommand('drawImage', () => {
    setState('drawing', {
      content: 'image',
      callback: (position: Vector2Data) => {
        exec('import', { position })
      },
    })
  })

  registerCommand('insertImage', async (url, options) => {
    return addElement({
      style: {
        ...await getImageSizeFromUrl(url),
      },
      foreground: { image: url },
      meta: { inPptIs: 'Picture' },
    }, options)
  })
})

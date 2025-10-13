import type { Element2D, Vector2Data } from 'modern-canvas'
import { definePlugin } from '../../editor'
import { getImageSizeFromUrl } from '../../utils'

declare global {
  namespace Mce {
    interface Commands {
      drawImage: () => void
      insertImage: (image: string, pos?: Vector2Data) => Promise<Element2D>
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

  registerCommand([
    { key: 'drawImage', handle: drawImage },
    { key: 'insertImage', handle: insertImage },
  ])

  function drawImage() {
    setState('drawing', {
      content: 'image',
      callback: (pos: Vector2Data) => {
        exec('import', pos)
      },
    })
  }

  async function insertImage(image: string, pos?: Vector2Data) {
    return addElement({
      style: {
        ...await getImageSizeFromUrl(image),
        left: pos?.x ?? 0,
        top: pos?.y ?? 0,
      },
      foreground: {
        image,
      },
      meta: {
        inPptIs: 'Picture',
      },
    }, pos
      ? undefined
      : { sizeToFit: true, positionToFit: true })
  }
})

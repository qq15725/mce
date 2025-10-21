import { render } from 'modern-canvas'
import { defineMixin } from '../../editor'

declare global {
  namespace Mce {
    interface Exporters {
      png: Blob
      jpeg: Blob
      webp: Blob
    }
  }
}

export default defineMixin((editor) => {
  const {
    registerExporter,
    to,
    fonts,
  } = editor

  registerExporter('jpeg', createImageExporter('jpeg'))
  registerExporter('png', createImageExporter('png'))
  registerExporter('webp', createImageExporter('webp'))

  function createImageExporter(type: string): Mce.Exporter {
    return async (options) => {
      const doc = await to('json', options)

      const canvas = await render({
        data: doc,
        fonts,
        width: (doc as any).style!.width,
        height: (doc as any).style!.height,
      })

      return await new Promise<Blob>((resolve) => {
        canvas.toBlob(
          v => resolve(v as Blob),
          type === 'jpg' ? 'image/jpeg' : `image/${type}`,
        )
      })
    }
  }
})

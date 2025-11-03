import type { Element2D, Vector2Data } from 'modern-canvas'
import { render } from 'modern-canvas'
import { definePlugin } from '../editor'
import { createImageElement, imageExtRe, imageExts } from '../utils'

declare global {
  namespace Mce {
    interface InsertImageOptions extends AddElementOptions {
      //
    }

    interface Commands {
      insertImage: (url: string, options?: InsertImageOptions) => Promise<Element2D>
      drawImage: () => void
    }

    interface Exporters {
      png: Blob
      jpeg: Blob
      webp: Blob
    }
  }
}

export default definePlugin((editor) => {
  const {
    setState,
    exec,
    addElement,
    to,
    fonts,
    upload,
  } = editor

  const insertImage: Mce.Commands['insertImage'] = async (url, options) => {
    return addElement(await createImageElement(url), {
      sizeToFit: true,
      positionToFit: true,
      ...options,
    })
  }

  const drawImage: Mce.Commands['drawImage'] = () => {
    setState('drawing', {
      content: 'image',
      callback: (position: Vector2Data) => {
        exec('import', { position })
      },
    })
  }

  function createExporter(name: string): Mce.Exporter {
    return {
      name,
      saveAs: true,
      handle: async (options) => {
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
            name === 'jpg' ? 'image/jpeg' : `image/${name}`,
          )
        })
      },
    }
  }

  return {
    name: 'mce:image',
    commands: [
      { command: 'insertImage', handle: insertImage },
      { command: 'drawImage', handle: drawImage },
    ],
    exporters: [
      createExporter('jpeg'),
      createExporter('png'),
      createExporter('webp'),
    ],
    loaders: [
      {
        name: 'image',
        accept: imageExts.join(','),
        test: (source) => {
          if (source instanceof Blob) {
            if (source.type.startsWith('image/')) {
              return true
            }
          }
          if (source instanceof File) {
            if (imageExtRe.test(source.name)) {
              return true
            }
          }
          return false
        },
        load: async (source: File | Blob) => {
          return await createImageElement(await upload(source))
        },
      },
    ],
  }
})

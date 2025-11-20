import type { Element2D } from 'modern-canvas'
import { DrawboardEffect, render } from 'modern-canvas'
import { definePlugin } from '../plugin'
import { createImageElement, imageExtRe, imageExts } from '../utils'

declare global {
  namespace Mce {
    interface InsertImageOptions extends AddElementOptions {
      //
    }

    interface Commands {
      insertImage: (url: string, options?: InsertImageOptions) => Promise<Element2D>
    }

    interface Exporters {
      png: Promise<Blob>
      jpeg: Promise<Blob>
      webp: Promise<Blob>
    }

    interface DrawingTools {
      image: []
    }
  }
}

export default definePlugin((editor) => {
  const {
    exec,
    addElement,
    to,
    fonts,
    upload,
    drawboardEffect,
  } = editor

  const insertImage: Mce.Commands['insertImage'] = async (url, options) => {
    return addElement(await createImageElement(url), {
      sizeToFit: true,
      position: 'right',
      ...options,
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
          width: doc.style.width,
          height: doc.style.height,
          onBefore: (engine) => {
            engine.root.append(
              new DrawboardEffect({
                ...drawboardEffect.value.getProperties(),
                internalMode: 'back',
                effectMode: 'before',
                checkerboard: false,
                pixelGrid: false,
              }),
            )
          },
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
    ],
    exporters: [
      { ...createExporter('png'), copyAs: true },
      createExporter('jpeg'),
      createExporter('webp'),
    ],
    loaders: [
      {
        name: 'image',
        accept: imageExts.join(','),
        test: (source) => {
          if (source instanceof Blob) {
            if (
              !source.type.startsWith('image/svg+xml')
              && source.type.startsWith('image/')
            ) {
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
    drawingTools: [
      { name: 'image', handle: position => exec('import', { position }) },
    ],
    hotkeys: [
      { command: 'copyAs:png', key: 'Shift+CmdOrCtrl+c' },
      { command: 'setActiveDrawingTool:image', key: 'Shift+CmdOrCtrl+k' },
    ],
  }
})

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

    interface Tools {
      image: []
    }
  }
}

// image/* 但浏览器无法当 <img> 渲染、且各有专属 loader 的容器格式，image loader 不应抢走。
const NON_RENDERABLE_IMAGE_MIME = ['image/svg+xml', 'image/vnd.adobe.photoshop']

export default definePlugin((editor) => {
  const {
    exec,
    addElement,
    to,
    fonts,
    upload,
    drawboardEffect,
    runExclusiveRender,
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

        const canvas = await runExclusiveRender(() => render({
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
        }))

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
            // File 继承自 Blob，故先走这里：仅认浏览器能直接当 <img> 渲染的 image/* 类型。
            // 排除有专属 loader、且 <img> 加载不了的位图容器——svg（矢量）、psd（Photoshop，
            // mime 也是 image/vnd.adobe.photoshop，否则整份 .psd 会被当图片加载而报 failed to load）。
            if (
              !NON_RENDERABLE_IMAGE_MIME.some(m => source.type.startsWith(m))
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
    tools: [
      { name: 'image', handle: position => exec('import', { position }) },
    ],
    hotkeys: [
      { command: 'copyAs:png', key: 'Shift+CmdOrCtrl+C' },
      { command: 'activateTool:image', key: 'Shift+CmdOrCtrl+K' },
    ],
  }
})

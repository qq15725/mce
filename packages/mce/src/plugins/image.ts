import type { Element2D, Engine } from 'modern-canvas'
import { DrawboardEffect, render, renderPixels } from 'modern-canvas'
import { definePlugin } from '../plugin'
import { createImageElement, getMaxCanvasSide, imageExtRe, imageExts, imageMimes, rgbaToPngBlob, supportsPngStream } from '../utils'

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

export default definePlugin((editor) => {
  const {
    exec,
    addElement,
    to,
    fonts,
    upload,
    drawboardEffect,
    runExclusiveRender,
    resolveImagePipelines,
    theme,
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
        // 图片是 render 类导出：语义色 token 烤成当前主题实际色，使导出图与画布一致（可被 options 覆盖）。
        options = { resolveTheme: theme.value, ...options }
        const doc = await to('json', options)
        const width = Math.max(1, Math.floor(doc.style.width))
        const height = Math.max(1, Math.floor(doc.style.height))
        const onBefore = (engine: Engine) => {
          engine.root.append(
            new DrawboardEffect({
              ...drawboardEffect.value.getProperties(),
              internalMode: 'back',
              effectMode: 'before',
              checkerboard: false,
              pixelGrid: false,
            }),
          )
        }

        // PNG 一律走直编码：renderPixels（tiling 全尺寸 RGBA）+ Sub-filter 直接编码，
        // 彻底绕过 HTMLCanvas 的面积上限（大图不再空白），体积也比 canvas.toBlob 略小。
        if (name === 'png' && supportsPngStream()) {
          const pixels = await runExclusiveRender(() => renderPixels({ data: doc, fonts, width, height, onBefore, imagePipelineResolver: resolveImagePipelines }))
          return rgbaToPngBlob(pixels, width, height)
        }

        // canvas 路径（jpeg / webp / 无 CompressionStream 的 png）：最终 toCanvas2D 受 2D canvas
        // 面积上限约束，超过会静默产出空白图。按实测 canvas 上限等比缩小输出尺寸（降采样 scale），
        // 保证产出有效图——上限由内核统一处理，调用方无需再自行钳制。
        let canvasDoc = doc
        const maxSide = getMaxCanvasSide()
        const maxArea = Math.floor(maxSide * maxSide * 0.98)
        const longest = Math.max(width, height)
        let shrink = 1
        if (longest > maxSide)
          shrink = maxSide / longest
        const areaAfterSide = (width * shrink) * (height * shrink)
        if (areaAfterSide > maxArea)
          shrink *= Math.sqrt(maxArea / areaAfterSide)
        if (shrink < 1)
          canvasDoc = await to('json', { ...options, scale: (options.scale ?? 1) * shrink })

        const canvas = await runExclusiveRender(() => render({
          data: canvasDoc,
          fonts,
          width: canvasDoc.style.width,
          height: canvasDoc.style.height,
          onBefore,
          imagePipelineResolver: resolveImagePipelines,
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
            // File 继承自 Blob，故先走这里：按 mime 白名单匹配（只认确知能被 <img> 渲染的位图类型）。
            // 用白名单而非 startsWith('image/')，避免把 svg / psd 等 image/* 容器（各有专属 loader、
            // <img> 又加载不了）误当图片——否则整份 .psd 会被当图片加载而报 failed to load image。
            if (imageMimes.includes(source.type)) {
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
      { name: 'image', handle: position => exec('importFile', { position }) },
    ],
    hotkeys: [
      { command: 'copyAs:png', key: 'Shift+CmdOrCtrl+C' },
      { command: 'activateTool:image', key: 'Shift+CmdOrCtrl+K' },
    ],
  }
})

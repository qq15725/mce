import type { DocxMeta, PptxMeta, XlsxMeta } from 'modern-openxml'
import { base64ToBytes, definePlugin, matchSource } from 'mce'

const PPTX_MIME = 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

declare global {
  namespace Mce {
    interface ExportOptions {
      pptx?: Partial<PptxMeta>
      xlsx?: Partial<XlsxMeta>
      docx?: Partial<DocxMeta>
    }

    interface Exporters {
      pptx: Promise<Blob>
      xlsx: Promise<Blob>
      docx: Promise<Blob>
    }
  }
}

export function plugin() {
  return definePlugin((editor) => {
    const {
      log,
      upload,
      to,
      fonts,
      resolveImagePipelines,
    } = editor

    // pptx/xlsx/docx 三个导出器共用：to('json') → 可选 reverse → 合并 meta → 转字节 → Blob。
    function makeExporter<K extends 'pptx' | 'xlsx' | 'docx'>(
      name: K,
      mime: string,
      reverse: boolean,
      withFonts: boolean,
      run: (payload: any) => Promise<Uint8Array | ArrayBuffer>,
    ): Mce.Exporter {
      return {
        name,
        saveAs: true,
        handle: async (options) => {
          const { [name]: specificOptions, ...jsonOptions } = options
          // 非 render 序列化导出：语义色 token 按浅色主题烤成实际色（可被 options 覆盖）。
          const doc = await to('json', { theme: 'light', ...jsonOptions })
          if (reverse) {
            doc.children?.reverse()
          }
          const bytes = await run({
            ...doc as any,
            ...(withFonts ? { fonts } : {}),
            meta: { ...doc.meta, ...specificOptions },
          })
          return new Blob([bytes as any], { type: mime })
        },
      }
    }

    return {
      name: 'mce:openxml',
      messages: {
        en: {
          'saveAs:pptx': 'Save as PPTX',
          'saveAs:xlsx': 'Save as XLSX',
          'saveAs:docx': 'Save as DOCX',
        },
        zhHans: {
          'saveAs:pptx': '另存为 PPTX',
          'saveAs:xlsx': '另存为 XLSX',
          'saveAs:docx': '另存为 DOCX',
        },
      },
      loaders: [
        {
          name: 'pptx',
          accept: '.pptx',
          test: matchSource({ ext: /\.pptx$/i, mime: PPTX_MIME }),
          load: async (source: File | Blob) => {
            // 重依赖 modern-openxml 按需加载：插件注册保持轻量，导入/导出代码仅首次用到时加载
            const [{ pptxToDoc }, presetShapeDefinitions] = await Promise.all([
              import('modern-openxml'),
              import('modern-openxml/presetShapeDefinitions').then(rep => rep.default),
            ])

            const doc = await pptxToDoc(await source.arrayBuffer(), {
              presetShapeDefinitions,
              upload: async (input, meta) => {
                const filename = meta.image
                let mimeType = getMimeType(meta.image)
                const arrayBuffer = base64ToBytes(input).buffer as ArrayBuffer
                if (!mimeType) {
                  const ext = detectImageExt(arrayBuffer)
                  if (ext) {
                    mimeType = getMimeType(ext)
                  }
                }
                return await upload(
                  new File([arrayBuffer], filename, {
                    type: mimeType ?? undefined,
                  }),
                )
              },
              progress: (current: number, total: number, cached: boolean) => {
                log('load pptx progress', `${current}/${total}`, cached ? 'cached' : '')
              },
            })

            doc.children?.forEach((child, index) => {
              child.name = `Slide ${index + 1}`
              child.style ??= {}
              child.style.left = 0
              child.style.top = Number(child.style.top)
              child.style.overflow = 'hidden'
              ;(child.meta as any).inEditorIs = 'Frame'
            })
            doc.children.reverse()

            doc.name = (source as any).name
            ;(doc.meta as any).inEditorIs = 'Doc'

            return doc
          },
        },
        {
          name: 'xlsx',
          accept: '.xlsx',
          test: matchSource({ ext: /\.xlsx$/i, mime: XLSX_MIME }),
          load: async (source: File | Blob) => {
            const { xlsxToDoc } = await import('modern-openxml')
            const doc = await xlsxToDoc(await source.arrayBuffer())
            doc.name = (source as any).name
            ;(doc.meta as any).inEditorIs = 'Doc'
            return doc
          },
        },
        {
          name: 'docx',
          accept: '.docx',
          test: matchSource({ ext: /\.docx$/i, mime: DOCX_MIME }),
          load: async (source: File | Blob) => {
            const { docxToDoc } = await import('modern-openxml')
            const doc = await docxToDoc(await source.arrayBuffer())
            doc.name = (source as any).name
            ;(doc.meta as any).inEditorIs = 'Doc'
            return doc
          },
        },
      ],
      exporters: [
        makeExporter('pptx', PPTX_MIME, true, true, async (payload) => {
          const { docToPptx } = await import('modern-openxml')
          // 图片处理管线下沉到 modern-openxml：注入引擎同款 resolver，由它在嵌入图片时烘焙。
          return await docToPptx(payload, { imagePipelineResolver: resolveImagePipelines }) as any
        }),
        makeExporter('xlsx', XLSX_MIME, false, false, async (payload) => {
          const { docToXlsx } = await import('modern-openxml')
          return await docToXlsx(payload) as any
        }),
        makeExporter('docx', DOCX_MIME, false, false, async (payload) => {
          const { docToDocx } = await import('modern-openxml')
          return await docToDocx(payload) as any
        }),
      ],
    }
  })
}

const EXT_TO_MIMES = {
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  gif: 'image/gif',
  bmp: 'image/bmp',
  emf: 'image/emf',
  wmf: 'image/wmf',
} as const

function getMimeType(filename: string): string | null {
  const arr = filename.split('.')
  const ext = arr[arr.length - 1].toLowerCase()
  return ext in EXT_TO_MIMES ? EXT_TO_MIMES[ext as keyof typeof EXT_TO_MIMES] : null
}

function detectImageExt(buffer: ArrayBuffer): string | undefined {
  const view = new DataView(buffer)
  const len = view.byteLength

  if (len < 4)
    return undefined

  const magic = view.getUint32(0, false)

  switch (magic) {
    case 0x89504E47:
      return 'png'
    case 0x47494638: // GIF87a 或 GIF89a
      if (len >= 6) {
        const version = view.getUint16(4, false)
        if (version === 0x3761 || version === 0x3961) {
          return 'gif'
        }
      }
      break
    case 0x52494646: // RIFF (可能是 WEBP)
      if (len >= 12 && view.getUint32(8, false) === 0x57454250) {
        return 'webp'
      }
      break
  }

  if (view.getUint8(0) === 0xFF && view.getUint8(1) === 0xD8 && view.getUint8(2) === 0xFF) {
    return 'jpeg'
  }

  if (view.getUint8(0) === 0x42 && view.getUint8(1) === 0x4D) {
    return 'bmp'
  }

  if (len >= 22) {
    if (view.getUint32(0, true) === 0x464D4520) {
      return 'emf'
    }
    else if (view.getUint16(0, true) === 0xD7CD || view.getUint16(6, true) === 0xD7CD) {
      return 'wmf' // 标准 WMF 或 Placeable WMF 变体
    }
  }

  return undefined
}

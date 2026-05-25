import type { DocxMeta, PptxMeta, XlsxMeta } from 'modern-openxml'
import { definePlugin } from 'mce'
import { docToDocx, docToPptx, docToXlsx, docxToDoc, pptxToDoc, xlsxToDoc } from 'modern-openxml'

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
    } = editor

    const RE = /\.pptx$/i

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
          test: (source) => {
            if (source instanceof Blob) {
              if (source.type.startsWith('application/vnd.openxmlformats-officedocument.presentationml.presentation')) {
                return true
              }
            }
            if (source instanceof File) {
              if (RE.test(source.name)) {
                return true
              }
            }
            return false
          },
          load: async (source: File | Blob) => {
            const presetShapeDefinitions = await import('modern-openxml/presetShapeDefinitions').then(rep => rep.default)

            const doc = await pptxToDoc(await source.arrayBuffer(), {
              presetShapeDefinitions,
              upload: async (input, meta) => {
                const filename = meta.image
                let mimeType = getMimeType(meta.image)
                const arrayBuffer = base64ToArrayBuffer(input)
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
          test: (source) => {
            if (source instanceof Blob && source.type.includes('spreadsheetml.sheet')) {
              return true
            }
            if (source instanceof File && /\.xlsx$/i.test(source.name)) {
              return true
            }
            return false
          },
          load: async (source: File | Blob) => {
            const doc = await xlsxToDoc(await source.arrayBuffer())
            doc.name = (source as any).name
            ;(doc.meta as any).inEditorIs = 'Doc'
            return doc
          },
        },
        {
          name: 'docx',
          accept: '.docx',
          test: (source) => {
            if (source instanceof Blob && source.type.includes('wordprocessingml.document')) {
              return true
            }
            if (source instanceof File && /\.docx$/i.test(source.name)) {
              return true
            }
            return false
          },
          load: async (source: File | Blob) => {
            const doc = await docxToDoc(await source.arrayBuffer())
            doc.name = (source as any).name
            ;(doc.meta as any).inEditorIs = 'Doc'
            return doc
          },
        },
      ],
      exporters: [
        {
          name: 'pptx',
          saveAs: true,
          handle: async (options) => {
            const { pptx: pptxOptions, ...jsonOptions } = options

            const doc = await to('json', jsonOptions)

            doc.children?.reverse()

            const pptx = await docToPptx({
              ...doc as any,
              fonts,
              meta: {
                ...doc.meta,
                ...pptxOptions,
              },
            }) as any

            return new Blob([pptx], {
              type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            })
          },
        },
        {
          name: 'xlsx',
          saveAs: true,
          handle: async (options) => {
            const { xlsx: xlsxOptions, ...jsonOptions } = options
            const doc = await to('json', jsonOptions)
            const xlsx = await docToXlsx({
              ...doc as any,
              meta: { ...doc.meta, ...xlsxOptions },
            })
            return new Blob([xlsx as any], {
              type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            })
          },
        },
        {
          name: 'docx',
          saveAs: true,
          handle: async (options) => {
            const { docx: docxOptions, ...jsonOptions } = options
            const doc = await to('json', jsonOptions)
            const docx = await docToDocx({
              ...doc as any,
              meta: { ...doc.meta, ...docxOptions },
            })
            return new Blob([docx as any], {
              type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            })
          },
        },
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

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64)
  const length = binaryString.length
  const buffer = new ArrayBuffer(length)
  const uint8Array = new Uint8Array(buffer)
  for (let i = 0; i < length; i++) {
    uint8Array[i] = binaryString.charCodeAt(i)
  }
  return buffer
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

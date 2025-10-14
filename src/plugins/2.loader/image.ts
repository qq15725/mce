import type { NormalizedElement } from 'modern-idoc'
import { idGenerator } from 'modern-idoc'
import { definePlugin } from '../../editor'
import { getImageSizeFromUrl } from '../../utils'

export const imageMap = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/svg+xml': ['.svg'],
  'image/tiff': ['.tif', '.tiff'],
  'image/bmp': ['.bmp'],
  'image/x-ms-bmp': ['.bmp'],
  'image/vnd.microsoft.icon': ['.ico'],
  'image/webp': ['.webp'],
  'image/heif': ['.heif'],
  'image/heic': ['.heic'],
  'image/avif': ['.avif'],
}

export const imageExts = Object.values(imageMap).flat()
export const imageExtRe = new RegExp(`\\.(?:${imageExts.map(v => v.substring(1)).join('|')})`, 'i')

export async function createImagaeElement(image: string): Promise<NormalizedElement> {
  return {
    id: idGenerator(),
    style: {
      ...await getImageSizeFromUrl(image),
    },
    foreground: { image },
    meta: { inPptIs: 'Picture' },
  }
}

export default definePlugin((editor) => {
  const {
    registerLoader,
    upload,
  } = editor

  registerLoader({
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
      const image = await upload(source)

      return createImagaeElement(image)
    },
  })
})

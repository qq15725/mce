import { idGenerator } from 'modern-idoc'
import { definePlugin } from '../../editor'
import { getImageSizeFromUrl } from '../../utils'

export default definePlugin((editor) => {
  const {
    registerLoader,
    upload,
  } = editor

  const map = {
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
  const exts = Object.values(map).flat()
  const RE = new RegExp(`\\.(?:${exts.map(v => v.substring(1)).join('|')})$`, 'i')

  registerLoader({
    name: 'image',
    accept: exts.join(','),
    test: (source) => {
      if (source instanceof Blob) {
        if (source.type.startsWith('image/')) {
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
      const image = await upload(source)

      return {
        id: idGenerator(),
        style: {
          ...await getImageSizeFromUrl(image),
        },
        foreground: { image },
        meta: { inPptIs: 'Picture' },
      }
    },
  })
})

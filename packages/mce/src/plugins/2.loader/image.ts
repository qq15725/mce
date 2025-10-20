import { definePlugin } from '../../editor'
import { createImageElement, imageExtRe, imageExts } from '../../utils'

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
      return await createImageElement(await upload(source))
    },
  })
})

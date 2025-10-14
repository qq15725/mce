import { idGenerator } from 'modern-idoc'
import { definePlugin } from '../../editor'
import { getImageSizeFromUrl } from '../../utils'

export default definePlugin((editor) => {
  const {
    registerLoader,
    upload,
  } = editor

  const RE = /\.(?:jpg|jpeg|png|webp)$/i

  registerLoader({
    name: 'image',
    accept: '.jpg,.jpeg,.png,.webp',
    test: (file) => {
      if (file instanceof Blob) {
        if (
          file.type.startsWith('image/jpeg')
          || file.type.startsWith('image/png')
          || file.type.startsWith('image/webp')
        ) {
          return true
        }
      }
      if (file instanceof File) {
        if (RE.test(file.name)) {
          return true
        }
      }
      return false
    },
    load: async (file: File) => {
      const image = await upload(file)
      return {
        id: idGenerator(),
        style: {
          ...await getImageSizeFromUrl(image),
        },
        foreground: {
          image,
        },
        meta: {
          inPptIs: 'Picture',
        },
      }
    },
  })
})

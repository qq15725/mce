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
      return file instanceof File && (
        RE.test(file.name)
        || file.type === 'image/jpeg'
        || file.type === 'image/png'
        || file.type === 'image/webp'
      )
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

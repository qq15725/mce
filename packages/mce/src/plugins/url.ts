import { definePlugin } from '../plugin'
import { createImageElement, imageExtRe } from '../utils'

export default definePlugin(() => {
  async function isImage(url: string) {
    try {
      const response = await fetch(url, { method: 'HEAD' })
      const contentType = response.headers.get('Content-Type')
      return contentType && contentType.startsWith('image/')
    }
    // eslint-disable-next-line unused-imports/no-unused-vars
    catch (_error: any) {
      return false
    }
  }

  return {
    name: 'mce:url',
    loaders: [
      {
        name: 'url',
        test: (source) => {
          return typeof source === 'string'
            && (
              source.startsWith('http')
              || imageExtRe.test(source)
            )
        },
        load: async (source: string) => {
          if (imageExtRe.test(source) || await isImage(source)) {
            return await createImageElement(source)
          }
          else {
            // TODO
            throw new Error(`Failed to load url, ${source}`)
          }
        },
      },
    ],
  }
})

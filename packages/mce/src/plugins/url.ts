import { definePlugin } from '../plugin'

export default definePlugin((editor) => {
  const {
    load,
    http,
  } = editor

  return {
    name: 'mce:url',
    loaders: [
      {
        name: 'url',
        test: (source) => {
          return typeof source === 'string'
        },
        load: async (url: string) => {
          const blob = (await http.request({ url, responseType: 'blob' })) as Blob
          const file = new File([blob], url, { type: blob.type })
          try {
            return await load(file)
          }
          catch (error) {
            throw new Error(`Failed to load source "${url}", ${error}`)
          }
        },
      },
    ],
  }
})

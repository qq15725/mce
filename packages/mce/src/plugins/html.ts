import { definePlugin } from '../plugin'

export default definePlugin((editor) => {
  const {
    load,
  } = editor

  const RE = /\.html$/i

  return {
    name: 'mce:html',
    loaders: [
      {
        name: 'html',
        accept: '.html',
        test: (source) => {
          if (source instanceof Blob) {
            if (source.type.startsWith('text/html')) {
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
        load: async (source: Blob | File) => {
          const dom = new DOMParser().parseFromString(await source.text(), 'text/html')
          try {
            return load(dom)
          }
          // eslint-disable-next-line unused-imports/no-unused-vars
          catch (_err: any) {
            return []
          }
        },
      },
    ],
  }
})

import { definePlugin } from '../editor'

export default definePlugin(() => {
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
          const mce = dom.querySelector('mce-clipboard')
          if (mce) {
            return JSON.parse(mce.textContent) as any[]
          }
          return []
        },
      },
    ],
  }
})

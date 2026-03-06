import { definePlugin } from '../plugin'

export default definePlugin(() => {
  return {
    name: 'mce:clipboard',
    loaders: [
      {
        name: 'mce-clipboard',
        test: (doc: Document) => {
          return doc instanceof Document
            && Boolean(doc.querySelector('mce-clipboard'))
        },
        load: async (doc: Document) => {
          const mce = doc.querySelector('mce-clipboard')
          if (mce) {
            return JSON.parse(mce.textContent) as any[]
          }
          return []
        },
      },
    ],
  }
})

import { definePlugin } from '../../editor'
import { createTextElement } from '../../utils'

export default definePlugin((editor) => {
  const {
    registerLoader,
  } = editor

  const RE = /\.txt$/i

  registerLoader({
    name: 'txt',
    accept: '.txt',
    test: (source) => {
      if (source instanceof Blob) {
        if (source.type.startsWith('text/plain')) {
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
      return createTextElement(await source.text())
    },
  })
})

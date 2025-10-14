import { idGenerator, normalizeTextContent } from 'modern-idoc'
import { measureText } from 'modern-text'
import { definePlugin } from '../../editor'

export default definePlugin((editor) => {
  const {
    registerLoader,
  } = editor

  const RE = /\.txt$/i

  registerLoader({
    name: 'text',
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
      return typeof source === 'string'
    },
    load: async (source: File | Blob | string) => {
      const content = typeof source === 'string'
        ? source
        : await source.text()

      const box = measureText({ content }).boundingBox

      return {
        id: idGenerator(),
        style: {
          width: box.width,
          height: box.height,
        },
        text: { content: normalizeTextContent(content) },
        meta: { inPptIs: 'Shape' },
      }
    },
  })
})

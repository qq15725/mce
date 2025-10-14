import { definePlugin } from '../../editor'

export default definePlugin((editor) => {
  const {
    registerLoader,
  } = editor

  const RE = /\.json$/i

  registerLoader({
    name: 'json',
    accept: '.json',
    test: (source) => {
      if (source instanceof Blob) {
        if (source.type.startsWith('application/json')) {
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
      const json = JSON.parse(await source.text())

      if (
        'version' in json
        && 'elements' in json
      ) {
        // TODO gd
        console.log(json)
      }

      return json
    },
  })
})

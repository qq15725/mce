import { definePlugin } from '../../editor'

export default definePlugin((editor) => {
  const {
    registerLoader,
  } = editor

  const RE = /\.json$/i

  registerLoader({
    name: 'json',
    accept: '.json',
    test: (file) => {
      if (file instanceof Blob) {
        if (file.type.startsWith('application/json')) {
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
      const json = JSON.parse(await file.text())

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

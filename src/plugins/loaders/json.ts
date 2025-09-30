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
      return file instanceof File
        && (
          RE.test(file.name)
        )
    },
    load: async (file: File) => {
      return JSON.parse(await file.text())
    },
  })
})

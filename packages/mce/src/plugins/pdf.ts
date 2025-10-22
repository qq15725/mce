import { definePlugin } from '../editor'

declare global {
  namespace Mce {
    interface Exporters {
      pdf: Blob
    }
  }
}

export default definePlugin((editor) => {
  const {
    to,
    fonts,
  } = editor

  return {
    name: 'pdf',
    exporters: [
      {
        name: 'pdf',
        handle: async (options) => {
          const { Pdf } = await import('modern-pdf')

          const doc = await to('json', options)

          return await new Pdf({
            ...doc,
            fonts,
          }).toBlob()
        },
      },
    ],
  }
})

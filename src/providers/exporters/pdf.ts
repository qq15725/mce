import { defineProvider } from '../../editor'

declare global {
  namespace Mce {
    interface Exporters {
      pdf: Blob
    }
  }
}

export default defineProvider((editor) => {
  const {
    registerExporter,
    to,
  } = editor

  registerExporter('pdf', async (options) => {
    const { Pdf } = await import('modern-pdf')

    const doc = await to('json', options)

    return await new Pdf(doc).toBlob()
  })
})

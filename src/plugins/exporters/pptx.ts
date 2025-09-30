import { definePlugin } from '../../editor'

declare global {
  namespace Mce {
    interface Exporters {
      pptx: Blob
    }
  }
}

export default definePlugin((editor) => {
  const {
    registerExporter,
    to,
  } = editor

  registerExporter('pptx', async (options) => {
    const { idocToPptx } = await import('modern-openxml')

    const doc = await to('json', options)

    return new Blob([(await idocToPptx(doc as any)) as any], {
      type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    })
  })
})

import { defineMixin } from '../../editor'

declare global {
  namespace Mce {
    interface Exporters {
      pptx: Blob
    }
  }
}

export default defineMixin((editor) => {
  const {
    registerExporter,
    to,
    fonts,
  } = editor

  registerExporter('pptx', async (options) => {
    const { idocToPptx } = await import('modern-openxml')

    const doc = await to('json', options)

    return new Blob([
      (
        await idocToPptx({
          ...doc as any,
          fonts,
        })
      ) as any,
    ], {
      type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    })
  })
})

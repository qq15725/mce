import { definePlugin } from 'mce'
import { Pdf } from 'modern-pdf'

declare global {
  namespace Mce {
    interface Exporters {
      pdf: Promise<Blob>
    }
  }
}

export function plugin() {
  return definePlugin((editor) => {
    const {
      to,
      fonts,
    } = editor

    return {
      name: 'mce:pdf',
      exporters: [
        {
          name: 'pdf',
          saveAs: true,
          handle: async (options) => {
            const doc = await to('json', options)
            doc.children?.reverse()
            return await new Pdf({
              ...doc,
              fonts,
            } as any).toBlob()
          },
        },
      ],
    }
  })
}

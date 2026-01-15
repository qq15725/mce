import type { PdfOptionMeta } from 'modern-pdf'
import { definePlugin } from 'mce'
import { Pdf } from 'modern-pdf'

declare global {
  namespace Mce {
    interface ExportOptions {
      pdf?: PdfOptionMeta
    }

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
            const { pdf: pdfOptions, ...jsonOptions } = options

            const doc = await to('json', jsonOptions)

            doc.children?.reverse()

            const pdf = new Pdf({
              ...doc,
              fonts,
              meta: {
                ...doc.meta,
                ...pdfOptions,
              },
            } as any)

            return await pdf.toBlob()
          },
        },
      ],
    }
  })
}

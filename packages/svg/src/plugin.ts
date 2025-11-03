import { definePlugin } from 'mce'
import { docToSvgString } from 'modern-idoc-svg'

declare global {
  namespace Mce {
    interface Exporters {
      svg: string
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
      name: 'mce:svg',
      exporters: [
        {
          name: 'svg',
          copyAs: true,
          saveAs: (exported: any) => new Blob([exported], { type: 'image/svg+xml' }),
          handle: async (options) => {
            const doc = await to('json', options)
            return docToSvgString({ ...doc, fonts } as any)
          },
        },
      ],
    }
  })
}

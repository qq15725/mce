import { definePlugin } from 'mce'
import { docToSvgBlob } from 'modern-idoc-svg'

declare global {
  namespace Mce {
    interface Exporters {
      svg: Blob
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
          handle: async (options) => {
            const doc = await to('json', options)

            return docToSvgBlob({ ...doc, fonts } as any)
          },
        },
      ],
    }
  })
}

import { definePlugin } from 'mce'
import { docToSvgString } from 'modern-idoc-svg'
import { svgToPath2DSet } from 'modern-path2d'

declare global {
  namespace Mce {
    interface Exporters {
      svg: Promise<string>
    }
  }
}

export function plugin() {
  return definePlugin((editor) => {
    const {
      to,
      fonts,
    } = editor

    const RE = /\.svg$/i

    return {
      name: 'mce:svg',
      loaders: [
        {
          name: 'svg',
          accept: '.svg',
          test: (source) => {
            if (source instanceof Blob) {
              if (source.type.startsWith('image/svg+xml')) {
                return true
              }
            }
            if (source instanceof File) {
              if (RE.test(source.name)) {
                return true
              }
            }
            return false
          },
          load: async (source: File | Blob) => {
            const svg = await source.text()
            const set = svgToPath2DSet(svg)
            const box = set.getBoundingBox()
            return {
              style: {
                width: box?.width ?? 0,
                height: box?.height ?? 0,
              },
              shape: {
                viewBox: set.viewBox,
                paths: set.paths.map((p) => {
                  return {
                    ...p.style,
                    data: p.toData(),
                  }
                }),
              },
              fill: '#000',
            }
          },
        },
      ],
      exporters: [
        {
          name: 'svg',
          copyAs: true,
          saveAs: (exported: any) => new Blob([exported], { type: 'image/svg+xml' }),
          handle: async (options) => {
            const doc = await to('json', options)
            return await docToSvgString({ ...doc, fonts } as any)
          },
        },
      ],
    }
  })
}

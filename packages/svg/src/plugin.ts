import { definePlugin, matchSource, materializeImagePipelines } from 'mce'

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
      resolveImagePipelines,
    } = editor

    return {
      name: 'mce:svg',
      messages: {
        en: { 'saveAs:svg': 'Save as SVG' },
        zhHans: { 'saveAs:svg': '另存为 SVG' },
      },
      loaders: [
        {
          name: 'svg',
          accept: '.svg',
          test: matchSource({ ext: /\.svg$/i, mime: 'image/svg+xml' }),
          load: async (source: File | Blob) => {
            // 重依赖按需加载：仅在真正导入 SVG 时才拉取 modern-path2d
            const { svgToPath2DSet } = await import('modern-path2d')
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
          copyAs: svgString => [
            new Blob([svgString], { type: 'text/plain' }),
            new Blob([svgString], { type: 'image/svg+xml' }),
          ],
          saveAs: svgString => new Blob([svgString], { type: 'image/svg+xml' }),
          handle: async (options) => {
            // 重依赖按需加载：仅在真正导出 SVG 时才拉取 modern-idoc-svg
            const { docToSvgString } = await import('modern-idoc-svg')
            const doc = await to('json', options)
            await materializeImagePipelines(doc, resolveImagePipelines)
            return await docToSvgString({ ...doc, fonts } as any)
          },
        },
      ],
    }
  })
}

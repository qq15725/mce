import { definePlugin, matchSource } from 'mce'

/** 把 .html / text/html 来源解析为 DOM 并交给核心 loader 转换为元素。 */
export function plugin() {
  return definePlugin((editor) => {
    const { load } = editor

    return {
      name: 'mce:html',
      loaders: [
        {
          name: 'html',
          accept: '.html',
          test: matchSource({ ext: /\.html$/i, mime: 'text/html' }),
          load: async (source: Blob | File) => {
            const dom = new DOMParser().parseFromString(await source.text(), 'text/html')
            try {
              return await load(dom)
            }
            catch (err) {
              console.error(err)
              return []
            }
          },
        },
      ],
    }
  })
}

import { definePlugin } from 'mce'

const RE = /\.html$/i

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
          test: (source) => {
            if (source instanceof Blob && source.type.startsWith('text/html')) {
              return true
            }
            if (source instanceof File && RE.test(source.name)) {
              return true
            }
            return false
          },
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

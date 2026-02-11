import type { Editor } from 'mce'
import { convertDoc } from '../convert'

export function bidTidLoader(editor: Editor, api: Record<string, any>): Mce.Loader {
  const {
    config,
    http,
  } = editor

  return {
    name: 'bigesj:bidTid',
    test: source => typeof source === 'object' && source && !!(source.bid || source.tid),
    load: async (source: { bid: string, tid: string }) => {
      const text = source.bid ?? source.tid ?? ''
      const load = async (id: string): Promise<Record<string, any>> => {
        return await http.request({
          url: (source.bid ? api.bid : api.tid).replace('%d', id),
          responseType: 'json',
        })
          .then(res => res.code === 200 ? res.data : res)
      }
      let maxTime = 0
      const docs = await Promise.all(
        text.split('|').map(async (text1) => {
          let [id, text2] = text1.split('[')
          if (text2) {
            text2 = text2.substring(0, text2.length - 1)
          }
          const included = text2 ? text2.split(',').map(v => Number(v)) : undefined
          const bigeDoc = await load(id)
          const doc = await convertDoc(bigeDoc, {
            included,
          })
          maxTime = Math.max(maxTime, doc.meta?.maxTime ?? 0)
          return doc
        }),
      )
      const doc = { ...docs[0], id: text, children: [] as any[] }
      if (!doc.meta) {
        doc.meta = {}
      }
      doc.meta.maxTime = maxTime
      doc.meta.inEditorIs = 'Doc'
      let left = 0
      docs.forEach((_doc) => {
        let width = 0
        _doc.children?.forEach((element) => {
          if (element.style) {
            if (Number(_doc.meta?.version ?? 0) <= 1) {
              element.style.left = left
              width = Math.max(width, Number(element.style.width))
            }
            doc.children.push(element)
          }
        })
        left += width + config.value.canvas.frame.gap
      })
      return doc
    },
  }
}

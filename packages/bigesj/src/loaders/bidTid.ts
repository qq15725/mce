import type { Editor } from 'mce'
import { convertDoc } from '../convert'

export function bidTidLoader(editor: Editor, api: Record<string, any>): Mce.Loader {
  const { config } = editor

  return {
    name: 'bigesj:bidTid',
    test: source => typeof source === 'object' && source && !!(source.bid || source.tid),
    load: async (source: { bid: string, tid: string }) => {
      const text = source.bid ?? source.tid ?? ''
      const load = async (id: string): Promise<Record<string, any>> => {
        return await fetch(
          (source.bid ? api.bid : api.tid).replace('%d', id),
        )
          .then(rep => rep.json())
          .then(res => JSON.parse(res.content))
      }
      let maxTime = 0
      const docs = await Promise.all(
        text.split('|').map(async (text1) => {
          let [id, text2] = text1.split('[')
          if (text2) {
            text2 = text2.substring(0, text2.length - 1)
          }
          const included = text2 ? text2.split(',').map(v => Number(v)) : undefined
          const bdoc = await load(id)
          // TODO 新数据结构存的version是2
          if (included !== undefined) {
            bdoc.layouts = bdoc.layouts.filter((_: any, index: number) => included.includes(index))
          }
          const idoc = await convertDoc(bdoc, config.value.frameGap)
          maxTime = Math.max(maxTime, idoc.meta?.maxTime ?? 0)
          return idoc
        }),
      )
      const doc = { ...docs[0], id: text, children: [] as any[] }
      doc.meta ??= {}
      doc.meta.maxTime = maxTime
      doc.meta.inEditorIs = 'Doc'
      let left = 0
      docs.forEach((_doc) => {
        let width = 0
        _doc.children?.forEach((element) => {
          if (element.style) {
            element.style.left = left
            width = Math.max(width, Number(element.style.width))
            doc.children.push(element)
          }
        })
        left += width + config.value.frameGap
      })
      return doc
    },
  }
}

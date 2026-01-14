import type { Editor } from 'mce'
import type { NormalizedDocument } from 'modern-idoc'
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
          .then(res => res.data)
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
          const { content: _content, ...raw } = bigeDoc
          const content = JSON.parse(_content)
          const version = Number(content.version ?? 1)
          let doc: NormalizedDocument
          if (version > 1) {
            doc = content
            if (!doc.meta) {
              doc.meta = {}
            }
            doc.meta.version = version
            doc.meta.raw = raw
          }
          else {
            if (included !== undefined) {
              content.layouts = content.layouts.filter((_: any, index: number) => included.includes(index))
            }
            doc = await convertDoc({ ...content, raw })
          }
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
        left += width + config.value.frameGap
      })
      return doc
    },
  }
}

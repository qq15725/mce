import { gunzipSync } from 'fflate'
import { convertDoc } from '../convert'

export function bigeLoader(): Mce.Loader {
  return {
    name: 'bigesj:bige',
    accept: '.bige',
    test: (file: any) => {
      return file instanceof File
        && file.name.endsWith('.bige')
    },
    load: async (file: File) => {
      const bigeDoc = JSON.parse(
        new TextDecoder().decode(
          gunzipSync(new Uint8Array(await file.arrayBuffer())),
        ),
      )
      const { content, ...raw } = bigeDoc
      const doc = await convertDoc(content)
      doc.meta!.raw = raw
      return doc
    },
  }
}

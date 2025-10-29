import type { Editor } from 'mce'
import { gunzipSync } from 'fflate'
import { convertDoc } from '../convert'

export function bigeLoader(editor: Editor): Mce.Loader {
  const { config } = editor

  return {
    name: 'bigesj:bige',
    accept: '.bige',
    test: (file: any) => {
      return file instanceof File
        && file.name.endsWith('.bige')
    },
    load: async (file: File) => {
      return await convertDoc(
        JSON.parse(
          new TextDecoder().decode(
            gunzipSync(new Uint8Array(await file.arrayBuffer())),
          ),
        ).content,
        config.value.frameGap,
      )
    },
  }
}

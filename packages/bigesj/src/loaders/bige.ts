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
      return await convertDoc(
        JSON.parse(
          new TextDecoder().decode(
            gunzipSync(new Uint8Array(await file.arrayBuffer())),
          ),
        ),
      )
    },
  }
}

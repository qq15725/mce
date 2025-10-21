import { gunzipSync } from 'fflate'
import { definePlugin } from 'mce'
import { convertDoc } from './convert'

export const plugin = definePlugin((editor) => {
  const { config, registerLoader } = editor

  registerLoader({
    name: 'bige',
    accept: '.bige',
    test: (file) => {
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
  })
})

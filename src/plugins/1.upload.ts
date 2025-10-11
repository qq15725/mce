import { useObjectUrl } from '@vueuse/core'
import { idGenerator } from 'modern-idoc'
import { definePlugin } from '../editor'

declare global {
  namespace Mce {
    type Upload = (file: File) => Promise<string>

    interface Editor {
      upload: Upload
    }
  }
}

export default definePlugin((editor) => {
  const {
    provideProperties,
    doc,
  } = editor

  const upload: Mce.Upload = async (file) => {
    const indexeddb = doc.value?.indexeddb
    if (indexeddb) {
      const id = idGenerator()
      await indexeddb.set(`file:${id}`, file)
      return `/~files/${indexeddb.name}/${id}`
    }
    const url = useObjectUrl(file).value
    if (!url) {
      throw new Error(`Failed to upload file: ${file.name}`)
    }
    return url
  }

  provideProperties({
    upload,
  })
})

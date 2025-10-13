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
  // const {
  //   doc,
  // } = editor

  const upload: Mce.Upload = async (file) => {
    // const indexeddb = doc.value?.indexeddb
    // if (indexeddb) {
    //   const id = idGenerator()
    //   await indexeddb.set(`file:${id}`, file)
    //   return `/~files/${indexeddb.name}/${id}`
    // }
    return URL.createObjectURL(file)
  }

  Object.assign(editor, {
    upload,
  })
})

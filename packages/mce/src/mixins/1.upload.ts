import { defineMixin } from '../editor'

declare global {
  namespace Mce {
    type Upload = (file: File | Blob) => Promise<string>

    interface Editor {
      upload: Upload
    }

    interface Options {
      upload?: Upload
    }
  }
}

export default defineMixin((editor, options) => {
  const upload: Mce.Upload = async (file) => {
    if (options.upload) {
      return await options.upload(file)
    }

    return URL.createObjectURL(file)
  }

  Object.assign(editor, {
    upload,
  })
})

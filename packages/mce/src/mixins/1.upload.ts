import { defineMixin } from '../editor'

declare global {
  namespace Mce {
    type Upload = (file: File | Blob) => Promise<string>

    interface Editor {
      upload: Upload
    }

    interface Options {
      handleUpload?: Upload
    }
  }
}

export default defineMixin((editor, options) => {
  const upload: Mce.Upload = async (file) => {
    if (options.handleUpload) {
      return await options.handleUpload(file)
    }

    return URL.createObjectURL(file)
  }

  Object.assign(editor, {
    upload,
  })
})

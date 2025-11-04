import { defineMixin } from '../editor'

declare global {
  namespace Mce {
    type Upload = (file: File | Blob) => Promise<string>

    interface Editor {
      upload: Upload
    }

    interface Options {
      customUpload?: Upload
    }
  }
}

export default defineMixin((editor, options) => {
  const upload: Mce.Upload = async (file) => {
    if (options.customUpload) {
      return await options.customUpload(file)
    }

    return URL.createObjectURL(file)
  }

  Object.assign(editor, {
    upload,
  })
})

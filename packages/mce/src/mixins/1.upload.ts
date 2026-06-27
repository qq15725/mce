import { defineMixin } from '../mixin'

declare global {
  namespace Mce {
    type Upload = (file: File | Blob) => Promise<string>

    interface Editor {
      upload: Upload
      /** 运行时设置/替换上传实现（返回上传后的可访问 URL）。 */
      setUploader: (uploader: Upload) => void
    }

    interface Options {
      /** 上传实现：传入 blob，返回上传后的可访问 URL。也可运行时用 {@link Editor.setUploader} 设置。 */
      uploader?: Upload
    }
  }
}

export default defineMixin((editor, options) => {
  // 默认上传用 createObjectURL 生成的 blob URL 会钉住底层 Blob，必须回收。
  const objectUrls = new Set<string>()

  let uploader: Mce.Upload | undefined = options.uploader

  const setUploader: Mce.Editor['setUploader'] = (fn) => {
    uploader = fn
  }

  const upload: Mce.Upload = async (file) => {
    if (uploader) {
      return await uploader(file)
    }

    const url = URL.createObjectURL(file)
    objectUrls.add(url)
    return url
  }

  // 切换文档时旧文档作废，回收其产生的对象 URL，避免反复 loadDoc/newDoc 累积内存。
  // 不在元素删除时回收，以免撤销恢复后图片失效。
  editor.on('docSet', () => {
    objectUrls.forEach(url => URL.revokeObjectURL(url))
    objectUrls.clear()
  })

  Object.assign(editor, {
    upload,
    setUploader,
  })
})

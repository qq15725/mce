import type { Editor } from 'mce'

// PSD 导入：fetch 仓库自带样本 example.psd，包成 File（按 .psd / mime 命中 @mce/psd loader）
// 经 loadDoc 走 loader 链 → 各图层展平为图片元素、整体包进一个 Frame。
export async function loadPsdDemo(editor: Editor): Promise<void> {
  const res = await fetch('/example.psd')
  const file = new File([await res.blob()], 'example.psd', { type: 'image/vnd.adobe.photoshop' })
  await editor.loadDoc(file)
  setTimeout(() => editor.exec('zoomToFit'), 100)
}

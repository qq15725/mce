import { definePlugin } from 'mce'
import { psdToFrame } from './convert'

const PSD_RE = /\.psd$/i

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => (blob ? resolve(blob) : reject(new Error('PSD layer canvas.toBlob failed'))),
      'image/png',
    )
  })
}

export function plugin() {
  return definePlugin((editor) => {
    const { upload, log } = editor

    return {
      name: 'mce:psd',
      messages: {
        en: { 'load:psd': 'Import PSD' },
        zhHans: { 'load:psd': '导入 PSD' },
      },
      loaders: [
        {
          name: 'psd',
          accept: '.psd',
          test: (source: any) => {
            if (source instanceof File) {
              return PSD_RE.test(source.name)
            }
            if (source instanceof Blob) {
              return source.type === 'image/vnd.adobe.photoshop' || source.type === 'application/x-photoshop'
            }
            return false
          },
          load: async (source: File | Blob) => {
            // 重依赖 ag-psd 按需加载：插件注册保持轻量，仅首次导入 PSD 时才拉取解析器。
            const { readPsd } = await import('ag-psd')
            const psd = readPsd(await source.arrayBuffer(), { useImageData: false })
            const frame = await psdToFrame(
              psd as any,
              async (canvas: any, layer: any) => upload(
                new File([await canvasToBlob(canvas)], `${layer.name || 'layer'}.png`, { type: 'image/png' }),
              ),
              (source as any).name,
            )
            log?.('load psd', `${frame.children?.length ?? 0} layers`)
            return frame
          },
        },
      ],
    }
  })
}

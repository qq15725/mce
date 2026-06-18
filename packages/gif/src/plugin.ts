import { definePlugin } from 'mce'
import { render } from 'modern-canvas'

declare global {
  namespace Mce {
    interface Options {
      gifWorkerUrl?: string
    }

    interface Exporters {
      gif: Promise<Blob>
    }
  }
}

export function plugin() {
  return definePlugin((editor, options) => {
    const {
      fonts,
      to,
      runExclusiveRender,
    } = editor

    // 消费方显式覆盖（自托管 / CDN / 严格 CSP）；缺省时由 createGifEncoder 自带默认 worker。
    const gifWorkerUrl = options.gifWorkerUrl

    return {
      name: 'mce:gif',
      messages: {
        en: { 'saveAs:gif': 'Save as GIF' },
        zhHans: { 'saveAs:gif': '另存为 GIF' },
      },
      exporters: [
        {
          name: 'gif',
          saveAs: true,
          handle: async (exportOptions) => {
            const { onProgress, ...restOptions } = exportOptions
            const data = to('json', restOptions)
            const { startTime, endTime } = data.meta
            const width = Math.floor(data.style.width)
            const height = Math.floor(data.style.height)
            // 按需加载：modern-gif + 内联 worker 只在导出时进入内存。
            const { createGifEncoder } = await import('./encode')
            const encoder = createGifEncoder({ width, height, workerUrl: gifWorkerUrl })
            await runExclusiveRender(() => render({
              data,
              width,
              height,
              fonts,
              keyframes: Array.from({ length: ~~((endTime - startTime) / 100) }, (_, i) => startTime + i * 100),
              onKeyframe: async (data, { duration, progress }) => {
                await encoder.encode({ data: data as any, delay: duration })
                onProgress?.(progress)
              },
            }))
            return await encoder.flush('blob')
          },
        },
      ],
    }
  })
}

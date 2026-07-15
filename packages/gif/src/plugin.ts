import { definePlugin } from 'mce'

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
      to,
      renderFrames,
      theme,
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
            // render 类导出：语义色 token 烤成当前主题实际色，使导出与画布一致（可被 options 覆盖）。
            const data = to('json', { theme: theme.value, ...restOptions })
            const width = Math.floor(data.style.width)
            const height = Math.floor(data.style.height)
            // 按需加载：modern-gif + 内联 worker 只在导出时进入内存。
            const { createGifEncoder } = await import('./encode')
            const encoder = createGifEncoder({ width, height, workerUrl: gifWorkerUrl })
            await renderFrames({
              data,
              width,
              height,
              step: 100,
              onFrame: async (pixels, { duration, progress }) => {
                await encoder.encode({ data: pixels as any, delay: duration })
                onProgress?.(progress)
              },
            })
            return await encoder.flush('blob')
          },
        },
      ],
    }
  })
}

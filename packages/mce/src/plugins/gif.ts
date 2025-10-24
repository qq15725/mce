import { assets, render } from 'modern-canvas'
import { definePlugin } from '../editor'

declare global {
  namespace Mce {
    interface Options {
      gifWorkerUrl?: string
    }

    interface Exporters {
      gif: Blob
    }
  }
}

export default definePlugin((editor, options) => {
  const {
    fonts,
    to,
  } = editor

  const gifWorkerUrl = options.gifWorkerUrl

  assets.gifWorkerUrl = gifWorkerUrl

  return {
    name: 'gif',
    exporters: [
      {
        name: 'gif',
        handle: async (options) => {
          const { Encoder } = await import('modern-gif')
          const { onProgress, ...restOptions } = options
          const data = to('json', restOptions)
          const { startTime, endTime } = data.meta
          const width = Math.floor(data.style.width)
          const height = Math.floor(data.style.height)
          const encoder = new Encoder({ width, height, workerUrl: gifWorkerUrl })
          await render({
            data,
            width,
            height,
            fonts,
            keyframes: Array.from({ length: ~~((endTime - startTime) / 100) }, (_, i) => startTime + i * 100),
            onFrame: async (data, { duration, progress }) => {
              await encoder.encode({ data: data as any, delay: duration })
              onProgress?.(progress)
            },
          })
          return await encoder.flush('blob')
        },
      },
    ],
  }
})

import { definePlugin } from 'mce'
import { render } from 'modern-canvas'
import { Encoder } from 'modern-gif'

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
      assets,
      fonts,
      to,
      runExclusiveRender,
    } = editor

    // 默认自带 modern-gif 的 worker：`new URL(..., import.meta.url)` 是打包器通用写法，
    // Vite / webpack5 / Rollup 会把 worker 文件作为 asset 产出，消费方无需再手动传 gifWorkerUrl。
    // 显式传入时优先用传入值（便于自托管 / CDN）；解析失败时 modern-gif 会回退主线程编码。
    let gifWorkerUrl = options.gifWorkerUrl
    if (!gifWorkerUrl) {
      try {
        gifWorkerUrl = new URL('modern-gif/worker', import.meta.url).href
      }
      catch {
        gifWorkerUrl = undefined
      }
    }

    assets.gifWorkerUrl = gifWorkerUrl

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
          handle: async (options) => {
            const { onProgress, ...restOptions } = options
            const data = to('json', restOptions)
            const { startTime, endTime } = data.meta
            const width = Math.floor(data.style.width)
            const height = Math.floor(data.style.height)
            const encoder = new Encoder({ width, height, workerUrl: gifWorkerUrl })
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

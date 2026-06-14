import { definePlugin } from 'mce'
import { render } from 'modern-canvas'

declare global {
  namespace Mce {
    interface Exporters {
      mp4: Promise<Blob>
    }
  }
}

export function plugin() {
  return definePlugin((editor) => {
    const {
      fonts,
      to,
      runExclusiveRender,
    } = editor

    return {
      name: 'mce:mp4',
      messages: {
        en: { 'saveAs:mp4': 'Save as MP4' },
        zhHans: { 'saveAs:mp4': '另存为 MP4' },
      },
      exporters: [
        {
          name: 'mp4',
          saveAs: true,
          handle: async (options) => {
            // 重依赖 modern-mp4 按需加载：仅在真正导出 MP4 时才拉取编码器
            const { MP4Encoder } = await import('modern-mp4')
            const { onProgress, ...restOptions } = options
            const data = to('json', restOptions)
            const { startTime, endTime } = data.meta
            const width = Math.floor(data.style.width / 2) * 2
            const height = Math.floor(data.style.height / 2) * 2
            const framerate = 30
            const encoderOptions: Record<string, any> = {
              width,
              height,
              framerate,
              audio: false,
            }
            const spf = 1000 / framerate
            const baseBitrateMap = {
              '720p': 3_000_000, // 3 Mbps
              '1080p': 6_000_000, // 6 Mbps
              '1440p': 12_000_000, // 12 Mbps
              '2160p': 20_000_000, // 20 Mbps
            }
            const resolutionLabel
              = width <= 1280 && height <= 720
                ? '720p'
                : width <= 1920 && height <= 1080
                  ? '1080p'
                  : width <= 2560 && height <= 1440
                    ? '1440p'
                    : '2160p'
            const baseBitrate = baseBitrateMap[resolutionLabel]
            encoderOptions.videoBitrate = Math.round(baseBitrate * (framerate / 30))
            if (!(await MP4Encoder.isConfigSupported(encoderOptions))) {
              throw new Error('Failed to parse encoding configuration')
            }
            const encoder = new MP4Encoder(encoderOptions)
            let timestamp = 1
            await runExclusiveRender(() => render({
              data,
              width,
              height,
              fonts,
              keyframes: Array.from({ length: ~~((endTime - startTime) / spf) }, (_, i) => startTime + i * spf),
              onKeyframe: async (data, { duration, progress }) => {
                const bitmap = await createImageBitmap(new ImageData(data as any, width, height))
                await encoder.encode({
                  data: bitmap,
                  timestamp,
                  duration,
                })
                bitmap.close()
                timestamp += duration
                onProgress?.(progress)
              },
            }))
            return await encoder.flush()
          },
        },
      ],
    }
  })
}

import { definePlugin } from 'mce'
import { render } from 'modern-canvas'
import { MP4Encoder } from 'modern-mp4'

declare global {
  namespace Mce {
    interface Exporters {
      svg: Blob
    }
  }
}

export function plugin() {
  return definePlugin((editor) => {
    const {
      fonts,
      to,
    } = editor

    return {
      name: 'mce:mp4',
      exporters: [
        {
          name: 'mp4',
          handle: async (options) => {
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
            await render({
              data,
              width,
              height,
              fonts,
              onFrame: async (data, { duration, progress }) => {
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
              keyframes: Array.from({ length: ~~((endTime - startTime) / spf) }, (_, i) => startTime + i * spf),
            })
            return await encoder.flush()
          },
        },
      ],
    }
  })
}

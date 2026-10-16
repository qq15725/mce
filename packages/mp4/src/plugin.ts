import { definePlugin } from 'mce'

declare global {
  namespace Mce {
    interface ExportOptions {
      /** MP4 默认保留视频原声；false 明确导出静音视频。 */
      audio?: boolean
      audioMaxBytes?: number
      mp4MaxBytes?: number
    }

    interface Exporters {
      mp4: Promise<Blob>
    }
  }
}

export function plugin() {
  return definePlugin((editor) => {
    const {
      to,
      renderFrames,
      renderAudio,
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
            const { CanvasMP4Encoder, loadVideoAudio, getMP4SupportError } = await import('modern-mp4')
            const { onProgress, signal, ...restOptions } = options
            signal?.throwIfAborted()
            // render 类导出：JSON 原样保留 token，主题解析由 renderFrames 在渲染期完成。
            const data = to('json', restOptions)
            const width = Math.floor(data.style.width / 2) * 2
            const height = Math.floor(data.style.height / 2) * 2
            const framerate = 30
            const unsupported = await getMP4SupportError({ width, height })
            if (unsupported)
              throw new Error(unsupported)
            const audio = options.audio === false
              ? undefined
              : await renderAudio({
                  data,
                  signal,
                  maxBytes: options.audioMaxBytes,
                  onProgress: p => onProgress?.(p * 0.15),
                  startTime: data.meta.startTime,
                  endTime: data.meta.endTime,
                  loadAudio: loadVideoAudio,
                })
            const encoderOptions: Record<string, any> = {
              width,
              height,
              framerate,
              audio: Boolean(audio),
              duration: (data.meta.endTime - data.meta.startTime) / 1000,
              signal,
              maxBytes: options.mp4MaxBytes,
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
            const encoder = await CanvasMP4Encoder.create(encoderOptions as Parameters<typeof CanvasMP4Encoder.create>[0])
            let timestamp = 0
            let audioOffset = 0
            try {
              await renderFrames({
                data,
                width,
                height,
                step: spf,
                signal,
                onFrame: async (pixels, { duration, progress }) => {
                  const bitmap = await createImageBitmap(new ImageData(pixels as any, width, height))
                  try {
                    await encoder.encode({ data: bitmap, timestamp, duration })
                  }
                  finally {
                    bitmap.close()
                  }
                  timestamp += duration
                  if (audio) {
                    const end = Math.min(audio.length, Math.round(timestamp * audio.sampleRate / 1000))
                    await encoder.encodeAudioBuffer(audio, audioOffset, end)
                    audioOffset = end
                  }
                  onProgress?.(0.15 + progress * 0.8)
                },
              })
              if (audio && audioOffset < audio.length)
                await encoder.encodeAudioBuffer(audio, audioOffset)
              const blob = await encoder.flush()
              onProgress?.(1)
              return blob
            }
            catch (error) {
              await encoder.abort()
              throw error
            }
          },
        },
      ],
    }
  })
}

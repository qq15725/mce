import { definePlugin } from '../../editor'

declare global {
  namespace Mce {
    interface Exporters {
      gif: Blob
      mp4: Blob
    }
  }
}

export default definePlugin((editor) => {
  const {
    registerExporter,
    renderEngine,
    log,
  } = editor

  async function renderFrames(
    cb: (frame: Uint8ClampedArray<ArrayBuffer>, delay: number) => Promise<void>,
    progress?: (current: number, total: number) => void,
    keyframes: number[] = [],
  ) {
    if (keyframes.length === 0) {
      keyframes = [0]
    }
    const engine = renderEngine.value
    engine.stop()
    engine.timeline.currentTime = 0
    await new Promise<void>((resolve) => {
      let i = 0
      const len = keyframes.length
      const last = keyframes[len - 1]
      async function loop() {
        if (i === len)
          return resolve()
        const current = keyframes[i++]
        const next = keyframes[i] || current
        const delay = next - current
        log(`[download] time: ${current} delay: ${delay}`)
        engine.timeline.currentTime = current
        engine.render()
        await cb(engine.toPixels(), delay)
        progress?.(~~((current / last) * 100), 100)
        requestAnimationFrame(loop)
      }
      loop()
    })
    engine.start()
  }

  registerExporter('gif', async (options) => {
    const { Encoder } = await import('modern-gif')
    const { onProgress } = options
    const engine = renderEngine.value
    const encoder = new Encoder({
      width: engine.width,
      height: engine.height,
    })
    await renderFrames(
      (data, delay) => encoder.encode({ data, delay }),
      onProgress,
      Array.from({ length: ~~(engine.timeline.endTime / 100) }, (_, i) => i * 100),
    )
    return await encoder.flush('blob')
  })

  registerExporter('mp4', async (options) => {
    const { onProgress } = options
    const { MP4Encoder: Encoder } = await import('modern-mp4')
    const engine = renderEngine.value
    const rawWidth = Math.floor(engine.width / 2) * 2
    const rawHeight = Math.floor(engine.height / 2) * 2
    const encoderOptions: Record<string, any> = {
      width: rawWidth,
      height: rawHeight,
      framerate: 30,
      audio: false,
    }
    const { width, height, framerate = 30 } = encoderOptions
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
    if (!(await Encoder.isConfigSupported(encoderOptions))) {
      throw new Error('Failed to parse encoding configuration')
    }
    const encoder = new Encoder(encoderOptions)
    let timestamp = 1
    await renderFrames(
      async (data, delay) => {
        const bitmap = await createImageBitmap(new ImageData(data, width, height))
        await encoder.encode({
          data: bitmap,
          timestamp,
          duration: delay,
        })
        bitmap.close()
        timestamp += delay
      },
      onProgress,
      Array.from({ length: ~~(engine.timeline.endTime / spf) }, (_, i) => i * spf),
    )
    return await encoder.flush()
  })
})

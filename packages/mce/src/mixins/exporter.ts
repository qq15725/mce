import type { Element2D } from 'modern-canvas'
import type { Reactive, Ref } from 'vue'
import { render, renderAudio } from 'modern-canvas'
import { ref } from 'vue'
import { defineMixin } from '../mixin'
import { createMapRegistry } from '../utils'

declare global {
  namespace Mce {
    type ExportOnProgress = (progress: number) => void

    interface ExportOptions {
      signal?: AbortSignal
      scale?: number
      selected?: boolean | Element2D[]
      onProgress?: ExportOnProgress
    }

    type ExporterHandle = (options: ExportOptions) => any | Promise<any>

    interface Exporter {
      name: string
      copyAs?: boolean | ((exported: any) => CopySource)
      saveAs?: boolean | ((exported: any) => Blob)
      handle: ExporterHandle
    }

    interface RenderFramesOptions {
      /** to('json') 的导出数据，需含 meta.startTime / meta.endTime。 */
      data: any
      width: number
      height: number
      /** 帧间隔（毫秒）。 */
      step: number
      signal?: AbortSignal
      onFrame: (pixels: Uint8ClampedArray, info: { duration: number, progress: number }) => void | Promise<void>
    }

    interface Editor {
      exporters: Reactive<Map<string, Exporter>>
      registerExporter: (value: Exporter | Exporter[]) => void
      unregisterExporter: (name: string) => void
      export: <K extends keyof Exporters>(name: K, options?: ExportOptions) => Exporters[K]
      to: <K extends keyof Exporters>(name: K, options?: ExportOptions) => Exporters[K]
      exporting: Ref<boolean>
      exportProgress: Ref<number>
      /** 按 step 逐帧渲染时间轴并回调像素，供 gif/mp4 等视频导出复用。 */
      renderFrames: (options: RenderFramesOptions) => Promise<void>
      /** 按导出树的时间轴混合视频原声。 */
      renderAudio: typeof renderAudio
    }
  }
}

export default defineMixin((editor) => {
  const {
    map: exporters,
    register: registerExporter,
    unregister: unregisterExporter,
  } = createMapRegistry<Mce.Exporter>(item => item.name)
  const exporting = ref(false)
  const exportProgress = ref(0)

  const renderFrames: Mce.Editor['renderFrames'] = async ({ data, width, height, step, onFrame, signal }) => {
    signal?.throwIfAborted()
    const { startTime, endTime } = data.meta
    const keyframes = Array.from(
      { length: Math.ceil((endTime - startTime) / step) },
      (_, i) => startTime + i * step,
    )
    await editor.runExclusiveRender(() => render({
      data,
      signal,
      width,
      height,
      fonts: editor.fonts,
      // 语义色 token 在渲染期由引擎按主题解析（JSON 原样保留 token，不烤色）。
      theme: editor.theme.value,
      themeTokens: editor.themeTokens.value,
      keyframes,
      imagePipelineResolver: editor.resolveImagePipelines,
      onKeyframe: (pixels: any, info: { currentTime: number }) => onFrame(pixels, {
        duration: Math.min(step, endTime - info.currentTime),
        progress: Math.min(1, (info.currentTime + step - startTime) / (endTime - startTime)),
      }),
    }))
  }

  const to: Mce.Editor['to'] = (name, options = {}) => {
    exportProgress.value = 0
    const res = exporters.get(name)?.handle({
      ...options,
      onProgress: (progress) => {
        exportProgress.value = progress
        options.onProgress?.(progress)
      },
    })
    if (res instanceof Promise) {
      exporting.value = true
      return res.finally(() => {
        exporting.value = false
      })
    }
    else {
      return res
    }
  }

  Object.assign(editor, {
    exporters,
    exporting,
    exportProgress,
    registerExporter,
    unregisterExporter,
    renderFrames,
    renderAudio,
    export: to,
    to,
  })
})

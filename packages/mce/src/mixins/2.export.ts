import type { Element2D } from 'modern-canvas'
import type { Ref } from 'vue'
import { ref } from 'vue'
import { defineMixin } from '../editor'

declare global {
  namespace Mce {
    type ExportOnProgress = (progress: number) => void

    interface ExportOptions {
      scale?: number
      selected?: boolean | Element2D[]
      onProgress?: ExportOnProgress
    }

    type ExporterHandle = (options: ExportOptions) => any | Promise<any>

    interface Exporter {
      name: string
      copyAs?: boolean | ((exported: any) => string)
      saveAs?: boolean | ((exported: any) => Blob)
      handle: ExporterHandle
    }

    interface Editor {
      exporters: Ref<Map<string, Exporter>>
      registerExporter: (value: Exporter | Exporter[]) => void
      unregisterExporter: (name: string) => void
      export: <K extends keyof Exporters>(name: K, options?: ExportOptions) => Exporters[K]
      to: <K extends keyof Exporters>(name: K, options?: ExportOptions) => Exporters[K]
      exporting: Ref<boolean>
      exportProgress: Ref<number>
    }
  }
}

export default defineMixin((editor) => {
  const exporters: Mce.Editor['exporters'] = ref(new Map<string, Mce.Exporter>())
  const exporting = ref(false)
  const exportProgress = ref(0)

  const registerExporter: Mce.Editor['registerExporter'] = (value) => {
    if (Array.isArray(value)) {
      value.forEach(item => registerExporter(item))
    }
    else {
      exporters.value.set(value.name, value)
    }
  }

  const unregisterExporter: Mce.Editor['unregisterExporter'] = (name) => {
    exporters.value.delete(name)
  }

  const to: Mce.Editor['to'] = (name, options = {}) => {
    const res = exporters.value.get(name)?.handle({
      ...options,
      onProgress: (progress) => {
        exportProgress.value = progress
        options.onProgress?.(progress)
      },
    })
    if (res instanceof Promise) {
      exportProgress.value = 0
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
    export: to,
    to,
  })
})

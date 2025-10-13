import type { Element2D } from 'modern-canvas'
import type { Ref } from 'vue'
import { ref } from 'vue'
import { definePlugin } from '../editor'

declare global {
  namespace Mce {
    type ExporterProgress = (current: number, total: number) => void

    interface ExporterOptions {
      scale?: number
      selected?: boolean | Element2D[]
      onProgress?: ExporterProgress
    }

    type Exporter = (options: ExporterOptions) => any | Promise<any>

    interface Editor {
      exporters: Ref<Map<string, Exporter>>
      registerExporter: {
        (key: string, exporter: Exporter): void
        (exporters: { key: string, handle: Exporter }[]): void
      }
      unregisterExporter: (key: keyof Exporters) => void
      to: <K extends keyof Exporters>(key: K, options?: ExporterOptions) => Exporters[K]
    }
  }
}

export default definePlugin((editor) => {
  const exporters: Mce.Editor['exporters'] = ref(new Map<string, Mce.Exporter>())

  const registerExporter: Mce.Editor['registerExporter'] = (...args: any[]) => {
    if (Array.isArray(args[0])) {
      args[0].forEach(v => exporters.value.set(v.key, v.handle))
    }
    else {
      exporters.value.set(args[0], args[1])
    }
  }

  const unregisterExporter: Mce.Editor['unregisterExporter'] = (key) => {
    exporters.value.delete(key)
  }

  const to: any = async (key: string, options: Mce.ExporterOptions = {}) => {
    return await exporters.value.get(key)?.(options)
  }

  Object.assign(editor, {
    exporters,
    registerExporter,
    unregisterExporter,
    to,
  })
})

import type { Element2D } from 'modern-canvas'
import type { Ref } from 'vue'
import { ref } from 'vue'
import { defineMixin } from '../editor'

declare global {
  namespace Mce {
    type ExporterProgress = (current: number, total: number) => void

    interface ExporterOptions {
      scale?: number
      selected?: boolean | Element2D[]
      onProgress?: ExporterProgress
    }

    type ExporterHandle = (options: ExporterOptions) => any | Promise<any>

    interface Exporter {
      name: string
      handle: ExporterHandle
    }

    interface Editor {
      exporters: Ref<Map<string, Exporter>>
      registerExporter: (value: Exporter | Exporter[]) => void
      unregisterExporter: (name: string) => void
      to: <K extends keyof Exporters>(name: K, options?: ExporterOptions) => Exporters[K]
    }
  }
}

export default defineMixin((editor) => {
  const exporters: Mce.Editor['exporters'] = ref(new Map<string, Mce.Exporter>())

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
    return exporters.value.get(name)?.handle(options)
  }

  Object.assign(editor, {
    exporters,
    registerExporter,
    unregisterExporter,
    to,
  })
})

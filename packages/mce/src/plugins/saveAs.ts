import { saveAs as _saveAs } from 'file-saver'
import { definePlugin } from '../editor'

declare global {
  namespace Mce {
    interface SaveAsOptions extends ExportOptions {
      filename?: string
    }

    interface Commands {
      saveAs: (type: keyof Exporters, options?: SaveAsOptions) => Promise<void>
    }
  }
}

export default definePlugin((editor) => {
  const {
    to,
    root,
    exporters,
  } = editor

  const saveAs: Mce.Commands['saveAs'] = async (key, options = {}) => {
    const {
      filename = root.value.meta.name ?? 'download',
      ...restOptions
    } = options

    let res = await to(key, {
      selected: true,
      ...restOptions,
    })

    const exporter = exporters.value.get(key)
    if (exporter && typeof exporter.saveAs === 'function') {
      res = exporter.saveAs(res)
    }

    if (!(res instanceof Blob)) {
      res = new Blob([JSON.stringify(res)], { type: 'application/json' })
    }

    _saveAs(res, `${filename}.${key}`)
  }

  return {
    name: 'mce:saveAs',
    commands: [
      { command: 'saveAs', handle: saveAs },
    ],
  }
})

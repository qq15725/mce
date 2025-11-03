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

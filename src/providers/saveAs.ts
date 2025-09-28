import { saveAs as _saveAs } from 'file-saver'
import { defineProvider } from '../editor'

declare global {
  namespace Mce {
    interface SaveAsOptions extends ExporterOptions {
      filename?: string
    }

    interface Commands {
      saveAs: (type: keyof Exporters, options?: SaveAsOptions) => Promise<void>
    }

    interface Editor {
      saveAs: (type: keyof Exporters, options?: SaveAsOptions) => Promise<void>
    }
  }
}

export default defineProvider((editor) => {
  const {
    to,
    registerCommand,
    provideProperties,
  } = editor

  async function saveAs(key: keyof Mce.Exporters, options: Mce.SaveAsOptions = {}): Promise<void> {
    const {
      filename = 'download',
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

  registerCommand([
    { key: 'saveAs', handle: (type, options) => saveAs(type, options) },
  ])

  provideProperties({
    saveAs,
  })
})

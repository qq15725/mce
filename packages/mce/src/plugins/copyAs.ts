import { definePlugin } from '../editor'

declare global {
  namespace Mce {
    interface CopyAsOptions extends ExportOptions {
      //
    }

    interface Commands {
      copyAs: (type: keyof Exporters, options?: CopyAsOptions) => Promise<void>
    }
  }
}

export default definePlugin((editor) => {
  const {
    to,
    exec,
    exporters,
  } = editor

  const copyAs: Mce.Commands['copyAs'] = async (key, options = {}) => {
    let res: any = await to(key, {
      selected: true,
      ...options,
    })

    const exporter = exporters.value.get(key)
    if (exporter && typeof exporter.copyAs === 'function') {
      res = exporter.copyAs(res)
    }

    exec('copy', res)
  }

  return {
    name: 'mce:copyAs',
    commands: [
      { command: 'copyAs', handle: copyAs },
    ],
  }
})

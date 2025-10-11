import { definePlugin } from '../editor'

declare global {
  namespace Mce {
    type Translation = (key: string, fallback?: string) => string

    interface Editor {
      t: Translation
    }

    interface Options {
      t?: Translation
    }
  }
}

export default definePlugin((editor, options) => {
  editor.t = (key: string, fallback?: string) => {
    if (fallback === undefined) {
      fallback = key
        .replace(/\/([a-z])/g, (raw, matched) => {
          return raw.replace(matched, matched.toUpperCase())
        })
        .replace(/([a-z])([0-9A-Z])/g, '$1 $2')
        .replace(/:/g, ' ')
        .trim()

      fallback = fallback.charAt(0).toUpperCase() + fallback.slice(1)
    }

    return options.t?.(key, fallback) ?? fallback
  }
})

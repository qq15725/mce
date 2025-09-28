import { defineProvider } from '../editor'

declare global {
  namespace Mce {
    type Translation = (key: string, fallback?: string) => string

    interface Editor {
      t: Translation
    }
  }
}

export default defineProvider((editor) => {
  const oldT = editor.t

  editor.t = (key: string, fallback?: string) => {
    if (fallback === undefined) {
      fallback = key
        .replace(/\/([a-z])/g, (raw, matched) => {
          return raw.replace(matched, matched.toUpperCase())
        })
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .trim()

      fallback = fallback.charAt(0).toUpperCase() + fallback.slice(1)
    }

    return oldT?.(key, fallback) ?? fallback
  }
})

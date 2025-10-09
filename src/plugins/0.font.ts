import type { FontLoadedResult, FontLoadOptions, FontSource } from 'modern-font'
import { ref } from 'vue'
import { definePlugin } from '../editor'

declare global {
  namespace Mce {
    interface Editor {
      loadFont: (source: FontSource, options?: FontLoadOptions) => Promise<FontLoadedResult>
      setDefaultFont: (source: FontSource, options?: FontLoadOptions) => Promise<void>
      waitUntilFontLoad: () => Promise<void>
    }

    interface Options {
      defaultFont?: FontSource
    }

    interface Events {
      loadFont: [font: FontLoadedResult]
    }
  }
}

export default definePlugin((editor) => {
  const {
    provideProperties,
    emit,
    fonts,
  } = editor

  const loading = ref(false)

  async function loadFont(source: FontSource, options?: FontLoadOptions): Promise<FontLoadedResult> {
    const res = await fonts.load(source, options)
    emit('loadFont', res)
    return res
  }

  async function setDefaultFont(source: FontSource, options?: FontLoadOptions): Promise<void> {
    loading.value = true
    try {
      fonts.fallbackFont = await loadFont(source, options)
    }
    finally {
      loading.value = false
    }
  }

  async function waitUntilFontLoad(): Promise<void> {
    while (loading.value) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    return await fonts.waitUntilLoad()
  }

  provideProperties({
    fonts,
    loadFont,
    setDefaultFont,
    waitUntilFontLoad,
  })

  return (_, options) => {
    const {
      defaultFont,
    } = options

    if (defaultFont) {
      setDefaultFont(defaultFont)
    }
  }
})

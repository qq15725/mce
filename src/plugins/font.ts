import type { FontLoadedResult, FontLoadOptions, FontSource } from 'modern-font'
import { ref } from 'vue'
import { definePlugin } from '../editor'

declare global {
  namespace Mce {
    interface Events {
      loadFont: [font: FontLoadedResult]
    }

    interface Editor {
      loadFont: (source: FontSource, options?: FontLoadOptions) => Promise<FontLoadedResult>
      setFallbackFont: (source: FontSource, options?: FontLoadOptions) => Promise<void>
      waitUntilFontLoad: () => Promise<void>
    }
  }
}

export default definePlugin((editor) => {
  const {
    provideProperties,
    emit,
    fonts,
  } = editor

  const fallbackFontLoading = ref(false)

  async function loadFont(source: FontSource, options?: FontLoadOptions): Promise<FontLoadedResult> {
    const res = await fonts.load(source, options)
    emit('loadFont', res)
    return res
  }

  async function setFallbackFont(source: FontSource, options?: FontLoadOptions): Promise<void> {
    fallbackFontLoading.value = true
    try {
      fonts.fallbackFont = await loadFont(source, options)
    }
    finally {
      fallbackFontLoading.value = false
    }
  }

  async function waitUntilFontLoad(): Promise<void> {
    while (fallbackFontLoading.value) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    return await fonts.waitUntilLoad()
  }

  provideProperties({
    fonts,
    loadFont,
    setFallbackFont,
    waitUntilFontLoad,
  })
})

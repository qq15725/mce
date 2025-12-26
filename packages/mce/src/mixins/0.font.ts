import type { FontLoadedResult, FontLoadOptions, FontSource } from 'modern-font'
import { ref } from 'vue'
import { defineMixin } from '../mixin'

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

export default defineMixin((editor, options) => {
  const {
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

  Object.assign(editor, {
    fonts,
    loadFont,
    setDefaultFont,
    waitUntilFontLoad,
  })

  return () => {
    const {
      defaultFont,
    } = options

    if (defaultFont) {
      setDefaultFont(defaultFont)
    }
  }
})

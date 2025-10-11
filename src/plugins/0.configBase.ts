import { watch } from 'vue'
import { definePlugin } from '../editor'

declare global {
  namespace Mce {
    interface Options extends Partial<Config> {
      //
    }

    type Theme = 'system' | 'light' | 'dark'
    type Language = string
    type ViewMode = 'frame' | 'edgeless'
    type TypographyStrategy = 'autoHeight' | 'autoWidth' | 'fixedWidthHeight' | 'autoFontSize'
    type HandleShape = 'rect' | 'circle'

    interface Config {
      theme: Theme
      language: Language
      viewMode: ViewMode
      camera: boolean
      ruler: boolean
      scrollbar: boolean
      bottombar: boolean
      statusbar: boolean
      wheelZoom: boolean
      frameGap: number
      typographyStrategy: TypographyStrategy
      handleShape: HandleShape
      localDb: boolean
    }
  }
}

export default definePlugin((editor) => {
  const {
    registerConfig,
    config,
  } = editor

  // UI
  registerConfig('theme', 'system')
  registerConfig('language', 'en')
  // Editor
  registerConfig('viewMode', 'edgeless')
  registerConfig('camera', false)
  registerConfig('ruler', false)
  registerConfig('scrollbar', false)
  registerConfig('bottombar', false)
  registerConfig('statusbar', false)
  registerConfig('wheelZoom', false)
  registerConfig('frameGap', 48)
  registerConfig('typographyStrategy', 'autoHeight')
  registerConfig('handleShape', 'rect')
  // DB
  registerConfig('localDb', false)

  return (editor, options) => {
    const {
      camera,
    } = editor

    Object.keys(config.value).forEach((key) => {
      if (key in options) {
        ;(config.value as any)[key] = (options as any)[key]
      }
    })

    watch(
      () => config.value.camera,
      (enable) => {
        camera.value.inputMode = enable ? 'inherit' : 'disabled'
      },
      { immediate: true },
    )
  }
})

import { watch } from 'vue'
import { definePlugin } from '../editor'

declare global {
  namespace Mce {
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
  registerConfig('language', 'zh-CN')
  // Editor
  registerConfig('viewMode', 'frame')
  registerConfig('camera', true)
  registerConfig('ruler', true)
  registerConfig('scrollbar', true)
  registerConfig('bottombar', true)
  registerConfig('statusbar', true)
  registerConfig('wheelZoom', false)
  registerConfig('frameGap', 48)
  registerConfig('typographyStrategy', 'autoHeight')
  registerConfig('handleShape', 'rect')
  // DB
  registerConfig('localDb', true)

  return () => {
    const {
      camera,
    } = editor

    watch(() => config.value.camera, (enable) => {
      camera.value.inputMode = enable ? 'inherit' : 'disabled'
    }, {
      immediate: true,
    })
  }
})

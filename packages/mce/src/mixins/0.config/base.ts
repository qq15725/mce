import { watch } from 'vue'
import { defineMixin } from '../../editor'

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
      checkerboard: boolean
      pixelGrid: boolean
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

export default defineMixin((editor, options) => {
  const {
    registerConfig,
    config,
  } = editor

  // UI
  registerConfig('theme', 'system')
  registerConfig('language', 'en')
  // Editor
  registerConfig('viewMode', 'edgeless')
  registerConfig('checkerboard', false)
  registerConfig('pixelGrid', false)
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

  return () => {
    const {
      camera,
      drawboardEffect,
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

    watch(
      () => config.value.checkerboard,
      enable => drawboardEffect.value.checkerboard = enable,
      { immediate: true },
    )

    watch(
      () => config.value.pixelGrid,
      enable => drawboardEffect.value.pixelGrid = enable,
      { immediate: true },
    )
  }
})

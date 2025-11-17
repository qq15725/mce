import type { CheckerboardStyle } from 'modern-canvas'
import { watch } from 'vue'
import { defineMixin } from '../../mixin'

declare global {
  namespace Mce {
    interface Options extends Partial<Config> {
      //
    }

    type Theme = 'system' | 'light' | 'dark'
    type ViewMode = 'frame' | 'edgeless'
    type TypographyStrategy = 'autoHeight' | 'autoWidth' | 'fixedWidthHeight' | 'autoFontSize'
    type HandleShape = 'rect' | 'circle'
    interface ScreenCenterOffset {
      left?: number
      top?: number
      right?: number
      bottom?: number
    }

    interface Config {
      theme: Theme
      viewMode: ViewMode
      watermark?: string
      checkerboard: boolean
      checkerboardStyle: CheckerboardStyle
      pixelGrid: boolean
      pixelate: boolean
      camera: boolean
      layers: boolean
      timeline: boolean
      statusbar: boolean
      frameOutline: boolean
      frameGap: number
      typographyStrategy: TypographyStrategy
      handleShape: HandleShape
      localDb: boolean
      screenCenterOffset: ScreenCenterOffset
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
  // Editor
  registerConfig('viewMode', 'edgeless')
  registerConfig('watermark', undefined)
  registerConfig('checkerboard', false)
  registerConfig('checkerboardStyle', 'grid')
  registerConfig('pixelGrid', false)
  registerConfig('pixelate', true)
  registerConfig('camera', false)
  registerConfig('layers', false)
  registerConfig('timeline', false)
  registerConfig('statusbar', false)
  registerConfig('frameOutline', false)
  registerConfig('frameGap', 48)
  registerConfig('typographyStrategy', 'autoHeight')
  registerConfig('handleShape', 'rect')
  registerConfig('screenCenterOffset', { left: 0, top: 0, bottom: 0, right: 0 })
  // DB
  registerConfig('localDb', false)

  return () => {
    const {
      renderEngine,
      camera,
      drawboardEffect,
    } = editor

    Object.keys(config.value).forEach((key) => {
      if (key in options) {
        ;(config.value as any)[key] = (options as any)[key]
      }
    })

    watch(
      () => config.value.pixelate,
      value => renderEngine.value.pixelate = value,
      { immediate: true },
    )

    watch(
      () => config.value.camera,
      (enable) => {
        camera.value.inputMode = enable ? 'inherit' : 'disabled'
      },
      { immediate: true },
    )

    watch(
      () => config.value.watermark,
      value => drawboardEffect.value.watermark = value,
      { immediate: true },
    )

    watch(
      () => config.value.checkerboard,
      value => drawboardEffect.value.checkerboard = value,
      { immediate: true },
    )

    watch(
      () => config.value.checkerboardStyle,
      value => drawboardEffect.value.checkerboardStyle = value,
      { immediate: true },
    )

    watch(
      () => config.value.pixelGrid,
      value => drawboardEffect.value.pixelGrid = value,
      { immediate: true },
    )
  }
})

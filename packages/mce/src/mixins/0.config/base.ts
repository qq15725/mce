import type { CheckerboardStyle } from 'modern-canvas'
import { watch } from 'vue'
import { defineMixin } from '../../mixin'

declare global {
  namespace Mce {
    interface Options extends Partial<Config> {
      //
    }

    type Theme = 'system' | 'light' | 'dark'
    type TypographyStrategy = 'autoHeight' | 'autoWidth' | 'fixedWidthHeight' | 'autoFontSize'

    interface ScreenCenterOffset {
      left?: number
      top?: number
      right?: number
      bottom?: number
    }

    interface TransformControlsConfig {
      handleShape?: 'rect' | 'circle'
    }

    interface Config {
      theme: Theme
      watermark?: string
      msaa: boolean
      checkerboard: boolean
      checkerboardStyle: CheckerboardStyle
      pixelGrid: boolean
      pixelate: boolean
      camera: boolean
      frameOutline: boolean
      frameGap: number
      typographyStrategy: TypographyStrategy
      transformControls: TransformControlsConfig
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

  registerConfig('theme', 'system')
  registerConfig('watermark', undefined)
  registerConfig('msaa', false)
  registerConfig('checkerboard', false)
  registerConfig('checkerboardStyle', 'grid')
  registerConfig('pixelGrid', false)
  registerConfig('pixelate', false)
  registerConfig('camera', false)
  registerConfig('frameOutline', false)
  registerConfig('frameGap', 48)
  registerConfig('typographyStrategy', 'autoHeight')
  registerConfig('transformControls', {})
  registerConfig('screenCenterOffset', { left: 0, top: 0, bottom: 0, right: 0 })
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
      () => config.value.msaa,
      value => renderEngine.value.msaa = value,
      { immediate: true },
    )

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

import type { CheckerboardStyle } from 'modern-canvas'
import { watch } from 'vue'
import { defineMixin } from '../../mixin'

declare global {
  namespace Mce {
    interface Options extends Partial<Config> {
      //
    }

    type Theme = 'system' | 'light' | 'dark'

    interface ScreenOffset {
      left?: number
      top?: number
      right?: number
      bottom?: number
    }

    interface TransformControlsConfig {
      handleShape?: 'rect' | 'circle'
      handleStrategy?: 'point'
      rotator?: boolean
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
      transformControls: TransformControlsConfig
      localDb: boolean
      screenCenterOffset: ScreenOffset
    }
  }
}

export default defineMixin((editor, options) => {
  const {
    registerConfig,
    config,
  } = editor

  registerConfig('theme', { default: 'system' })
  registerConfig('watermark', { default: undefined })
  registerConfig('msaa', { default: false })
  registerConfig('checkerboard', { default: false })
  registerConfig('checkerboardStyle', { default: 'grid' })
  registerConfig('pixelGrid', { default: false })
  registerConfig('pixelate', { default: false })
  registerConfig('camera', { default: false })
  registerConfig('frameOutline', { default: false })
  registerConfig('frameGap', { default: 48 })
  registerConfig('transformControls', { default: {} })
  registerConfig('screenCenterOffset', { default: { left: 0, top: 0, bottom: 0, right: 0 } })
  registerConfig('localDb', { default: false })

  return () => {
    const {
      renderEngine,
      camera,
      drawboardEffect,
      setConfig,
    } = editor

    Object.keys(config.value).forEach((key) => {
      if (key in options) {
        setConfig(key, (options as any)[key])
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

import type { CheckerboardStyle } from 'modern-canvas'
import { watch } from 'vue'
import { defineMixin } from '../../mixin'
import { deepMerge } from '../../utils'

declare global {
  namespace Mce {
    interface CameraConfig {
      enabled: boolean
    }

    interface CheckerboardConfig {
      enabled: boolean
      style: CheckerboardStyle
    }

    interface PixelGridConfig {
      enabled: boolean
    }

    interface PixelateConfig {
      enabled: boolean
    }

    interface MsaaConfig {
      enabled: boolean
    }

    interface WatermarkConfig {
      url?: string
      width: number
      alpha: number
      rotation: number
    }

    interface ViewportConfig {
      camera: CameraConfig
    }

    interface CanvasConfig {
      checkerboard: CheckerboardConfig
      pixelGrid: PixelGridConfig
      pixelate: PixelateConfig
      msaa: MsaaConfig
      watermark: WatermarkConfig
    }

    interface UIConfig {
      //
    }

    interface InteractionConfig {
      //
    }

    interface DBConfig {
      local: boolean
    }

    interface Config {
      viewport: ViewportConfig
      canvas: CanvasConfig
      ui: UIConfig
      interaction: InteractionConfig
      db: DBConfig
    }
  }
}

export default defineMixin((editor, options) => {
  const {
    registerConfig,
    config,
  } = editor

  registerConfig('viewport', { default: {} })
  registerConfig('canvas', { default: {} })
  registerConfig('ui', { default: {} })
  registerConfig('interaction', { default: {} })
  registerConfig('db', {
    default: {
      local: false,
    },
  })

  const cameraConfig = registerConfig<Mce.CameraConfig>('viewport.camera', {
    default: {
      enabled: false,
    },
  })

  const watermarkConfig = registerConfig<Mce.WatermarkConfig>('canvas.watermark', {
    default: {
      url: undefined,
      width: 100,
      alpha: 0.05,
      rotation: 0.5236,
    },
  })

  const checkerboardConfig = registerConfig<Mce.CheckerboardConfig>('canvas.checkerboard', {
    default: {
      enabled: false,
      style: 'grid',
    },
  })

  const pixelGridConfig = registerConfig<Mce.PixelGridConfig>('canvas.pixelGrid', {
    default: {
      enabled: false,
    },
  })

  const pixelateConfig = registerConfig<Mce.PixelateConfig>('canvas.pixelate', {
    default: {
      enabled: false,
    },
  })

  const msaaConfig = registerConfig<Mce.MsaaConfig>('canvas.msaa', {
    default: {
      enabled: false,
    },
  })

  return () => {
    const {
      renderEngine,
      camera,
      drawboardEffect,
    } = editor

    Object.keys(config.value).forEach((key) => {
      const value = (options as any)[key]
      if (value !== undefined) {
        if (value !== null && typeof value === 'object') {
          deepMerge((config.value as any)[key], value)
        }
        else {
          ;(config.value as any)[key] = value
        }
      }
    })

    watch(
      () => msaaConfig.value.enabled,
      value => renderEngine.value.msaa = value,
      { immediate: true },
    )

    watch(
      () => pixelateConfig.value.enabled,
      value => renderEngine.value.pixelate = value,
      { immediate: true },
    )

    watch(
      () => cameraConfig.value.enabled,
      value => camera.value.inputMode = value ? 'inherit' : 'disabled',
      { immediate: true },
    )

    watch(watermarkConfig, (config) => {
      drawboardEffect.value.watermark = config.url
      drawboardEffect.value.watermarkWidth = config.width
      drawboardEffect.value.watermarkAlpha = config.alpha
      drawboardEffect.value.watermarkRotation = config.rotation
    }, { immediate: true, deep: true })

    watch(
      () => checkerboardConfig.value.enabled,
      value => drawboardEffect.value.checkerboard = value,
      { immediate: true },
    )

    watch(
      () => checkerboardConfig.value.style,
      value => drawboardEffect.value.checkerboardStyle = value,
      { immediate: true },
    )

    watch(
      () => pixelGridConfig.value.enabled,
      value => drawboardEffect.value.pixelGrid = value,
      { immediate: true },
    )
  }
})

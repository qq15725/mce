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

    interface FxaaConfig {
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
      fxaa: FxaaConfig
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
      db: DBConfig
      ui: UIConfig
      canvas: CanvasConfig
      viewport: ViewportConfig
      interaction: InteractionConfig
    }
  }
}

export default defineMixin((editor, options) => {
  const {
    registerConfig,
    config,
  } = editor

  registerConfig('db', {
    default: {
      local: false,
    },
  })
  registerConfig('ui', { default: {} })
  registerConfig('canvas', { default: {} })
  registerConfig('viewport', { default: {} })
  registerConfig('interaction', { default: {} })

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
      enabled: true,
      style: 'grid',
    },
  })

  const pixelGridConfig = registerConfig<Mce.PixelGridConfig>('canvas.pixelGrid', {
    default: {
      enabled: true,
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

  // 轻量抗锯齿：最终合成时的 FXAA 后处理（零额外显存，见 modern-canvas SceneTree.fxaa）。
  const fxaaConfig = registerConfig<Mce.FxaaConfig>('canvas.fxaa', {
    default: {
      enabled: true,
    },
  })

  const cameraConfig = registerConfig<Mce.CameraConfig>('viewport.camera', {
    default: {
      enabled: true,
    },
  })

  return () => {
    const {
      renderEngine,
      camera,
      drawboardEffect,
      theme,
      themeTokens,
    } = editor

    // 底纹家族：config 的 style 只保留 grid / dot（明暗不再进枚举，旧的 gridDark/dotDark 归一到家族）。
    function checkerboardFamily(base: string): any {
      return base === 'dot' || base === 'dotDark' ? 'dot' : 'grid'
    }
    // 底纹颜色走主题解析：token → 当前主题实际色（默认预设 checkerboard / checkerboard-dot）。
    function themeColor(token: string): string {
      return themeTokens.value[token]?.[theme.value] ?? token
    }

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
      () => fxaaConfig.value.enabled,
      value => renderEngine.value.fxaa = value,
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
      style => drawboardEffect.value.checkerboardStyle = checkerboardFamily(style),
      { immediate: true },
    )

    // 底纹颜色随 theme / 调色板变化重解析并回灌引擎（明暗切换由此驱动，不再靠 style 枚举）。
    watch(
      () => [theme.value, themeTokens.value] as const,
      () => {
        drawboardEffect.value.checkerboardColor = themeColor('background')
        drawboardEffect.value.checkerboardDotColor = themeColor('background-dot')
      },
      { immediate: true, deep: true },
    )

    watch(
      () => pixelGridConfig.value.enabled,
      value => drawboardEffect.value.pixelGrid = value,
      { immediate: true },
    )
  }
})

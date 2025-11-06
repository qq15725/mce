import { watch } from 'vue'
import { defineMixin } from '../../editor'

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
      checkerboard: boolean
      pixelGrid: boolean
      camera: boolean
      ruler: boolean
      scrollbar: boolean
      timeline: boolean
      statusbar: boolean
      wheelZoom: boolean
      frameOutline: boolean
      frameGap: number
      typographyStrategy: TypographyStrategy
      handleShape: HandleShape
      localDb: boolean
      screenCenterOffset: ScreenCenterOffset
    }

    interface Editor {
      getScreenCenterOffset: () => Required<ScreenCenterOffset>
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
  registerConfig('checkerboard', false)
  registerConfig('pixelGrid', false)
  registerConfig('camera', false)
  registerConfig('ruler', false)
  registerConfig('scrollbar', false)
  registerConfig('timeline', false)
  registerConfig('statusbar', false)
  registerConfig('wheelZoom', false)
  registerConfig('frameOutline', false)
  registerConfig('frameGap', 48)
  registerConfig('typographyStrategy', 'autoHeight')
  registerConfig('handleShape', 'rect')
  // DB
  registerConfig('localDb', false)

  const screenCenterOffset = { left: 0, top: 0, bottom: 0, right: 0 }

  registerConfig('screenCenterOffset', { ...screenCenterOffset })

  const getScreenCenterOffset: Mce.Editor['getScreenCenterOffset'] = () => {
    const offset = {
      ...screenCenterOffset,
      ...config.value.screenCenterOffset,
    }
    if (config.value.scrollbar) {
      offset.right += 8
      offset.bottom += 8
    }
    if (config.value.ruler) {
      offset.left += 16
      offset.top += 16
    }
    return offset
  }

  Object.assign(editor, {
    getScreenCenterOffset,
  })

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

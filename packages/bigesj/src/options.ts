import type { Options } from 'mce'

export const options: Options = {
  locale: { locale: 'zhHans' },
  viewport: {
    camera: { enabled: true },
    zoom: { strategy: 'containWidth' },
    screenPadding: { left: 110, top: 60, right: 110, bottom: 60 },
  },
  canvas: {
    checkerboard: { enabled: true, style: 'dot' },
    pixelGrid: { enabled: true },
    frame: { gap: 48, outline: false, thumbnail: false },
  },
  ui: {
    ruler: { visible: false },
    scrollbar: { visible: true },
    statusbar: { visible: true },
    toolbelt: { visible: true },
  },
  interaction: {
    transform: {
      handleShape: 'circle',
      handleStyle: '8-points',
      lockAspectRatioStrategy: 'diagonal',
      rotator: true,
    },
  },
  typography: {
    strategy: 'autoHeight',
    defaultFont: {
      family: 'SourceHanSansCN-Normal',
      src: 'https://bige.cdn.bcebos.com/files/202006/cBNrzOsE_rAQB.woff',
    },
  },
}

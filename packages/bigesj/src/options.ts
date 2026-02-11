import type { Options } from 'mce'

export const options: Options = {
  // locale: { language: 'zh-Hans' },
  locale: { locale: 'zhHans' },
  viewport: {
    camera: { enabled: true },
    zoom: { strategy: 'containWidth' },
    screenPadding: { left: 110, top: 60, right: 110, bottom: 60 },
  },
  canvas: {
    checkerboard: { enabled: true, style: 'grid' },
    pixelGrid: { enabled: true },
    frame: { outline: false },
  },
  ui: {
    ruler: { enabled: true },
    scrollbar: { enabled: true },
    statusbar: { enabled: true },
  },
  interaction: {
    transform: {
      handleShape: 'circle',
      handleStrategy: 'point',
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

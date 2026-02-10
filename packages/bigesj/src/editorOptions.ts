export const editorOptions: Partial<Mce.Options> = {
  checkerboard: true,
  checkerboardStyle: 'grid',
  pixelGrid: true,
  camera: true,
  ruler: true,
  scrollbar: true,
  statusbar: true,
  frameGap: 48,
  zoomToFit: 'width',
  typography: {
    strategy: 'autoHeight',
  },
  locale: { locale: 'zhHans' },
  defaultFont: { family: 'SourceHanSansCN-Normal', src: 'https://bige.cdn.bcebos.com/files/202006/cBNrzOsE_rAQB.woff' },
  transformControls: {
    handleShape: 'circle',
    handleStrategy: 'point',
    rotator: true,
  },
}

/** 将引擎画面完整替换到显示画布，保留尺寸未变时的缓冲与上下文。 */
export function copyCanvasFrame(canvas: HTMLCanvasElement, source: HTMLCanvasElement): void {
  if (!source.width || !source.height)
    return

  if (canvas.width !== source.width)
    canvas.width = source.width
  if (canvas.height !== source.height)
    canvas.height = source.height
  const pixelRatio = source.dataset.pixelRatio
  if (canvas.dataset.pixelRatio !== pixelRatio) {
    if (pixelRatio === undefined)
      delete canvas.dataset.pixelRatio
    else
      canvas.dataset.pixelRatio = pixelRatio
  }

  const context = canvas.getContext('2d')
  if (!context)
    return

  // copy 同时覆盖透明像素，避免 source-over 留下上一帧残影；也无需先清空再绘制。
  // resize 会重置上下文，因此每次绘制前设置合成方式。
  context.globalCompositeOperation = 'copy'
  context.drawImage(source, 0, 0, source.width, source.height)
}

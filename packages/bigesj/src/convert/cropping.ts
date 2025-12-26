export interface BigeCropping {
  imageWidth: number
  imageHeight: number
  maskWidth?: number
  maskHeight?: number
  translateX: number
  translateY: number
  zoom?: number
}

export function croppingToCropRect(cropping: BigeCropping, width: number, height: number) {
  const {
    imageWidth,
    imageHeight,
    maskWidth = width,
    maskHeight = height,
    translateX,
    translateY,
    zoom = 1,
  } = cropping
  const cvsWidth = imageWidth * zoom
  const cvsHeight = imageHeight * zoom
  const distX = (cvsWidth - maskWidth) / 2 - translateX
  const distY = (cvsHeight - maskHeight) / 2 - translateY
  const originX = distX + maskWidth / 2
  const originY = distY + maskHeight / 2
  const left = -(width / 2 - originX)
  const top = -(height / 2 - originY)
  const right = cvsWidth - (left + width)
  const bottom = cvsHeight - (top + height)
  return {
    left: left / cvsWidth,
    top: top / cvsHeight,
    right: right / cvsWidth,
    bottom: bottom / cvsHeight,
  }
}

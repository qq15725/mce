export interface BigeCropping {
  imageWidth: number
  imageHeight: number
  maskWidth?: number
  maskHeight?: number
  translateX: number
  translateY: number
  zoom?: number
}

export function croppingToCropRect(cropping: BigeCropping, elWidth: number, elHeight: number) {
  const {
    imageWidth,
    imageHeight,
    maskWidth = elWidth,
    maskHeight = elHeight,
    translateX,
    translateY,
    zoom = 1,
  } = cropping
  const width = imageWidth * zoom
  const height = imageHeight * zoom
  const distX = (width - maskWidth) / 2 - translateX
  const distY = (height - maskHeight) / 2 - translateY
  const originX = distX + maskWidth / 2
  const originY = distY + maskHeight / 2
  const left = -(elWidth / 2 - originX)
  const top = -(elHeight / 2 - originY)
  const right = width - (left + elWidth)
  const bottom = height - (top + elHeight)
  return {
    left: left / width,
    top: top / height,
    right: right / width,
    bottom: bottom / height,
  }
}

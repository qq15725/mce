export interface BigeTransform {
  imageWidth: number
  imageHeight: number
  originWidth?: number
  originHeight?: number
  translateX: number
  translateY: number
  zoom?: number
}

export function transformToCropRect(transform: BigeTransform, elWidth: number, elHeight: number) {
  const {
    imageWidth: _imageWidth,
    imageHeight: _imageHeight,
    originWidth: _originWidth = elWidth,
    originHeight: _originHeight = elHeight,
    translateX,
    translateY,
    zoom = 1,
  } = transform
  const imageWidth = Math.max(_imageWidth, elWidth)
  const imageHeight = Math.max(_imageHeight, elHeight)
  const width = imageWidth * zoom
  const height = imageHeight * zoom
  const left = -(imageWidth * (zoom - 1) / 2) + translateX * zoom
  const top = -(imageHeight * (zoom - 1) / 2) + translateY * zoom
  const right = left + width
  const bottom = top + height
  return {
    left: -left / width,
    top: -top / height,
    right: -(elWidth - right) / width,
    bottom: -(elHeight - bottom) / height,
  }
}

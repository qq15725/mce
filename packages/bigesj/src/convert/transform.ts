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
    imageWidth,
    imageHeight,
    originWidth: _originWidth = elWidth,
    originHeight: _originHeight = elHeight,
    translateX,
    translateY,
    zoom = 1,
  } = transform
  const width = imageWidth * zoom
  const height = imageHeight * zoom
  const left = -(imageWidth * (zoom - 1) / 2) + translateX * zoom
  const top = -(imageHeight * (zoom - 1) / 2) + translateY * zoom
  const right = left + imageWidth * zoom
  const bottom = top + imageHeight * zoom
  return {
    left: -left / width,
    top: -top / height,
    right: -(elWidth - right) / width,
    bottom: -(elHeight - bottom) / height,
  }
}

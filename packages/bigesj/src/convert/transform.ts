export interface BigeTransform {
  imageWidth: number
  imageHeight: number
  originWidth?: number
  originHeight?: number
  translateX: number
  translateY: number
  zoom?: number
}

export function transformToCropRect(transform: BigeTransform, width: number, height: number) {
  const {
    imageWidth,
    imageHeight,
    originWidth: _originWidth = width,
    originHeight: _originHeight = height,
    translateX,
    translateY,
    zoom = 1,
  } = transform
  const left = -(imageWidth * (zoom - 1) / 2) + translateX * zoom
  const top = -(imageHeight * (zoom - 1) / 2) + translateY * zoom
  const right = left + imageWidth * zoom
  const bottom = top + imageHeight * zoom
  return {
    left: -left / width,
    top: -top / height,
    right: -(width - right) / width,
    bottom: -(height - bottom) / height,
  }
}

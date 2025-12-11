import type { OrientedBoundingBox } from '../types'

export function boundingBoxToStyle(box: OrientedBoundingBox): Record<string, any> {
  const style: Record<string, any> = {
    left: `${box.left}px`,
    top: `${box.top}px`,
    width: `${box.width}px`,
    height: `${box.height}px`,
  }
  if (box.rotate) {
    style.transform = `rotate(${box.rotate}deg)`
  }
  return style
}

import type { Camera2D } from 'modern-canvas'
import type { OrientedBoundingBox } from '../types'

export function boundingBoxToStyle(box: OrientedBoundingBox, camera?: Camera2D): Record<string, any> {
  const style: Record<string, any> = {
    left: `${box.left * (camera?.zoom.x ?? 1) - (camera?.position.x ?? 0)}px`,
    top: `${box.top * (camera?.zoom.y ?? 1) - (camera?.position.y ?? 0)}px`,
    width: `${box.width * (camera?.zoom.x ?? 1)}px`,
    height: `${box.height * (camera?.zoom.y ?? 1)}px`,
  }
  if (box.rotate) {
    style.transform = `rotate(${box.rotate}deg)`
  }
  return style
}

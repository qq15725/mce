import type { Vector2Data } from 'modern-canvas'
import type { AxisAlignedBoundingBox, OrientedBoundingBox } from '../types'

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

export function isPointInsideAabb(point: Vector2Data, box: AxisAlignedBoundingBox): boolean {
  const right = box.left + box.width
  const bottom = box.top + box.height
  return (
    point.x >= box.left
    && point.x <= right
    && point.y >= box.top
    && point.y <= bottom
  )
}

export function isOverlappingAabb(
  aabb1: AxisAlignedBoundingBox,
  aabb2: AxisAlignedBoundingBox,
  axis?: 'vertical' | 'horizontal',
): boolean {
  switch (axis) {
    case 'horizontal':
      return aabb1.left + aabb1.width >= aabb2.left
        && aabb2.left + aabb2.width >= aabb1.left
    case 'vertical':
      return aabb1.top + aabb1.height >= aabb2.top
        && aabb2.top + aabb2.height >= aabb1.top
    default:
      return isOverlappingAabb(aabb1, aabb2, 'horizontal')
        && isOverlappingAabb(aabb1, aabb2, 'vertical')
  }
}

type Vector = [number, number]

export function isOverlappingObb(box1: OrientedBoundingBox, box2: OrientedBoundingBox) {
  if (!box1.rotate && !box2.rotate) {
    return isOverlappingAabb(box1, box2)
  }
  else {
    // Separating Axis Theorem
    const dotProduct = ([ax, ay]: Vector, [bx, by]: Vector) => Math.abs(ax * bx + ay * by)
    const createSAT = ({ width, height, rotate = 0 }: OrientedBoundingBox) => {
      rotate = -rotate % 180
      const deg = (rotate / 180) * Math.PI
      const axisX = [Math.cos(deg), -Math.sin(deg)] as Vector
      const axisY = [Math.sin(deg), Math.cos(deg)] as Vector
      return {
        axis: [axisX, axisY],
        projectionRadius: (axis: Vector) =>
          (width / 2) * dotProduct(axis, axisX) + (height / 2) * dotProduct(axis, axisY),
      }
    }
    const data1 = createSAT(box1)
    const data2 = createSAT(box2)
    const center = [
      box1.left + box1.width / 2 - (box2.left + box2.width / 2),
      box1.top + box1.height / 2 - (box2.top + box2.height / 2),
    ] as Vector
    for (const axis of [...data1.axis, ...data2.axis]) {
      if (
        data1.projectionRadius(axis) + data2.projectionRadius(axis)
        < dotProduct(axis, center)
      ) {
        return false
      }
    }
    return true
  }
}

export function minBoundingBox(rects: OrientedBoundingBox[]): OrientedBoundingBox {
  if (rects.length < 2) {
    return {
      left: rects[0]?.left ?? 0,
      top: rects[0]?.top ?? 0,
      width: rects[0]?.width ?? 0,
      height: rects[0]?.height ?? 0,
    }
  }
  const res = rects.slice(1).reduce(
    (acc, rect) => {
      acc.x1 = Math.min(acc.x1, rect.left)
      acc.y1 = Math.min(acc.y1, rect.top)
      acc.x2 = Math.max(acc.x2, rect.left + rect.width)
      acc.y2 = Math.max(acc.y2, rect.top + rect.height)
      return acc
    },
    {
      x1: rects[0].left,
      y1: rects[0].top,
      x2: rects[0].left + rects[0].width,
      y2: rects[0].top + rects[0].height,
    },
  )
  return { left: res.x1, top: res.y1, width: res.x2 - res.x1, height: res.y2 - res.y1 }
}

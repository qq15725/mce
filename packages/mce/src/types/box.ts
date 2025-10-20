export interface AxisAlignedBoundingBox {
  left: number
  top: number
  width: number
  height: number
}

export interface OrientedBoundingBox extends AxisAlignedBoundingBox {
  rotate?: number
}

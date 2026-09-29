interface LabelBox {
  left: number
  top: number
  width: number
  height: number
  rotation: number
}

/** 标题沿节点上边显示；转过 90° 后换到对边，避免文字倒置。rotation 使用弧度。 */
export function nodeLabelEdge(box: LabelBox) {
  const angle = ((box.rotation * 180 / Math.PI % 360) + 360) % 360
  const flipped = angle > 90 && angle <= 270
  const cos = Math.cos(box.rotation)
  const sin = Math.sin(box.rotation)
  const x = (flipped ? 1 : -1) * box.width / 2
  const y = (flipped ? 1 : -1) * box.height / 2
  return {
    left: box.left + box.width / 2 + x * cos - y * sin,
    top: box.top + box.height / 2 + x * sin + y * cos,
    width: box.width,
    angle: flipped ? angle - 180 : angle > 270 ? angle - 360 : angle,
  }
}

export function nodeLabelStyle(box: LabelBox) {
  const edge = nodeLabelEdge(box)
  return {
    transform: `translate(${edge.left}px, ${edge.top}px) rotate(${edge.angle}deg) translateY(calc(-100% - 6px))`,
    transformOrigin: '0 0',
    maxWidth: `${Math.max(0, edge.width)}px`,
  }
}

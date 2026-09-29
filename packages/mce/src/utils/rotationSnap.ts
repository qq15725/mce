/** 普通拖动靠近 45° 时吸附，Shift 只吸附直角，Alt 临时自由旋转。 */
export function snapRotation(angle: number, modifiers: { shiftKey?: boolean, altKey?: boolean } = {}): number {
  if (modifiers.altKey)
    return angle
  const step = modifiers.shiftKey ? 90 : 45
  const target = Math.round(angle / step) * step
  return Math.abs(target - angle) <= 4 ? target : angle
}

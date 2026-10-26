import type { Element2D, Node } from 'modern-canvas'
import { Node2D } from 'modern-canvas'

/** 换父级时保持世界变换，包含旋转、缩放、斜切和画板滚动偏移。 */
export function movePreservingTransform(parent: Node, el: Element2D, index: number): void {
  if (parent.equal(el) || parent.findAncestor(node => node.equal(el)))
    return
  if (el.parent?.equal(parent)) {
    parent.moveChild(el, index)
    return
  }
  el.updateGlobalTransform()
  const local = el.globalTransform.clone()
  // Doc 根节点没有二维变换，移回根节点时直接使用世界坐标。
  if (parent instanceof Node2D) {
    const matrix = parent.globalTransform
    if (matrix.a * matrix.d - matrix.b * matrix.c === 0)
      return
    local.prepend(matrix.clone().affineInverse())
      .translate(parent.contentOffset.x, parent.contentOffset.y)
  }
  const { a, b, c, d, tx, ty } = local
  const scaleX = Math.hypot(a, b)
  const scaleY = (a * d - b * c) / scaleX
  if (!scaleX || !scaleY)
    return
  const { x: px, y: py } = el.pivot
  parent.moveChild(el, index)
  // Node2D 用 tan(skew)，与 Transform2D.decompose 的斜切约定不同。
  Object.assign(el.style, {
    left: tx + px * a + py * c - px,
    top: ty + px * b + py * d - py,
    rotate: Math.atan2(b, a) * 180 / Math.PI,
    scaleX,
    scaleY,
    skewX: Math.atan((a * c + b * d) / (scaleX * scaleY)),
    skewY: 0,
    transform: '',
  })
  el.updateGlobalTransform()
}

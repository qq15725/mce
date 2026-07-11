import type { Node } from 'modern-canvas'

// 画板(frame)裁剪内容时，落在画板外的部分在画布上被引擎裁掉，但选择/悬停等 DOM
// 覆盖层不受画布裁剪影响，会溢出到画板之外。这里据「元素框」与「祖先画板屏幕矩形」
// 的相交，给覆盖层算一个 clip-path(inset)，把框裁到画板可见区内（滚动出画板即隐藏）。

export interface ClipRect { left: number, top: number, width: number, height: number }

// overflow 非 visible 即裁剪内容（hidden/clip/scroll/auto）。
export function overflowClips(el: any): boolean {
  const o = el?.style?.overflow
  return o === 'hidden' || o === 'clip' || o === 'scroll' || o === 'auto'
}

/**
 * 覆盖层框(box) 相对祖先裁剪画板(frameRect) 的 clip-path。二者均为 drawboard 像素坐标。
 * 完全在画板内返回 undefined（不裁）；部分溢出返回 inset(...)；完全在外返回全裁（隐藏）。
 */
export function insetClipPath(box: ClipRect, frameRect: ClipRect): string | undefined {
  const top = Math.max(0, frameRect.top - box.top)
  const left = Math.max(0, frameRect.left - box.left)
  const bottom = Math.max(0, (box.top + box.height) - (frameRect.top + frameRect.height))
  const right = Math.max(0, (box.left + box.width) - (frameRect.left + frameRect.width))
  if (top <= 0 && left <= 0 && bottom <= 0 && right <= 0) {
    return undefined
  }
  return `inset(${top}px ${right}px ${bottom}px ${left}px)`
}

/**
 * 求覆盖层框在其祖先裁剪画板下的 clip-path。
 * @param el 被框住的元素
 * @param box 该元素的 drawboard 像素框
 * @param getAncestorFrame editor.getAncestorFrame
 * @param getFrameRect (frame) => 画板的 drawboard 像素框（getAabb(frame,'drawboard')）
 */
export function frameClipPath(
  el: Node | undefined,
  box: ClipRect,
  getAncestorFrame: (n?: Node) => any,
  getFrameRect: (frame: any) => ClipRect,
): string | undefined {
  if (!el) {
    return undefined
  }
  const frame = getAncestorFrame(el)
  if (!frame || !overflowClips(frame)) {
    return undefined
  }
  return insetClipPath(box, getFrameRect(frame))
}

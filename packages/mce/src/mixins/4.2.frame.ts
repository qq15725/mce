import type { Element2D, Vector2Like } from 'modern-canvas'
import { defineMixin } from '../mixin'

declare global {
  namespace Mce {
    interface HandleDragOutReparentOptions {
      pointer: Vector2Like
      parent: Element2D
      index: number
    }

    interface Editor {
      handleDragOutReparent: (element: Element2D, context?: HandleDragOutReparentOptions) => void
    }
  }
}

export default defineMixin((editor) => {
  const {
    root,
    frames,
    isTopLevelFrame,
    exec,
  } = editor

  function handleDragOutReparent(
    element: Element2D,
    options?: Mce.HandleDragOutReparentOptions,
  ): void {
    const pointer = options?.pointer as any
    const frame1 = element.findAncestor(node => isTopLevelFrame(node))
    const aabb1 = element.getGlobalAabb()
    const area1 = aabb1.getArea()
    let flag = true
    for (let i = 0, len = frames.value.length; i < len; i++) {
      const frame2 = frames.value[i]
      if (frame2.equal(element)) {
        continue
      }
      const aabb2 = frame2.getGlobalAabb()
      if (aabb2) {
        if (
          pointer
            ? aabb2.containsPoint(pointer)
            : (aabb1 && aabb1.getIntersectionRect(aabb2).getArea() > area1 * 0.5)
        ) {
          if (!frame2.equal(frame1)) {
            let index = frame2.children.length
            if (frame2.equal(options?.parent)) {
              index = options!.index
            }
            element.style.left = aabb1.x - aabb2.x
            element.style.top = aabb1.y - aabb2.y
            frame2.moveChild(element, index)
            exec('layerScrollIntoView')
          }
          flag = false
          break
        }
      }
    }

    if (
      flag
      && frame1
    ) {
      element.style.left = aabb1.x
      element.style.top = aabb1.y
      root.value.moveChild(element, root.value.children.length)
      exec('layerScrollIntoView')
    }
  }

  Object.assign(editor, {
    handleDragOutReparent,
  })
})

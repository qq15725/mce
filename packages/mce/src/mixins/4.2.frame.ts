import type { Element2D } from 'modern-canvas'
import { defineMixin } from '../mixin'

declare global {
  namespace Mce {
    interface Editor {
      setCurrentFrame: (index?: number) => void
      handleElementInsideFrame: (element: Element2D) => void
    }

    interface Events {
      setCurrentFrame: [index: number, oldIndex: number]
    }
  }
}

export default defineMixin((editor) => {
  const {
    root,
    currentFrameIndex,
    emit,
    selection,
    frames,
    config,
    isTopLevelFrame,
  } = editor

  function setCurrentFrame(index = currentFrameIndex.value): void {
    index = Math.max(0, Math.min(frames.value.length - 1, index))
    const oldIndex = currentFrameIndex.value
    currentFrameIndex.value = index
    if (config.value.viewMode === 'edgeless') {
      selection.value = [frames.value[index]]
    }
    else {
      selection.value = []
    }
    emit('setCurrentFrame', index, oldIndex)
  }

  function handleElementInsideFrame(element: Element2D): void {
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
      if (aabb1 && aabb2) {
        if (aabb1.getIntersectionRect(aabb2).getArea() > area1 * 0.5) {
          if (!frame2.equal(frame1)) {
            frame2.appendChild(element)
            element.style.left = aabb1.x - aabb2.x
            element.style.top = aabb1.y - aabb2.y
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
      root.value.moveChild(element, 0)
      element.style.left = aabb1.x
      element.style.top = aabb1.y
    }
  }

  Object.assign(editor, {
    setCurrentFrame,
    handleElementInsideFrame,
  })
})

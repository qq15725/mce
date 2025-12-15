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
    const source = element.getGlobalAabb()
    const aArea = source.getArea()
    let flag = true
    for (let i = 0, len = frames.value.length; i < len; i++) {
      const frame = frames.value[i]
      if (element.equal(frame)) {
        continue
      }
      const target = frame.getGlobalAabb()
      if (source && target) {
        if (source.getIntersectionRect(target).getArea() > aArea * 0.5) {
          if (!element.findAncestor(ancestor => ancestor.equal(frame))) {
            frame.appendChild(element)
            element.style.left = source.x - target.x
            element.style.top = source.y - target.y
          }
          flag = false
          break
        }
      }
    }
    if (flag && element.parent && !element.parent.equal(root.value)) {
      root.value.moveChild(element, 0)
      element.style.left = source.x
      element.style.top = source.y
    }
  }

  Object.assign(editor, {
    setCurrentFrame,
    handleElementInsideFrame,
  })
})

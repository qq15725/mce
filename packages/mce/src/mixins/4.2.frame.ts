import type { Element2D } from 'modern-canvas'
import type { Element } from 'modern-idoc'
import { normalizeElement } from 'modern-idoc'
import { defineMixin } from '../mixin'

declare global {
  namespace Mce {
    interface Editor {
      addFrame: (element?: Element, toIndex?: number) => void
      duplicateFrame: (index?: number) => void
      moveFrame: (fromIndex: number, toIndex: number) => void
      deleteFrame: (index?: number) => void
      setCurrentFrame: (index?: number) => void
      handleElementInsideFrame: (element: Element2D) => void
    }

    interface Events {
      addFrame: [index: number]
      duplicateFrame: [index: number]
      moveFrame: [fromIndex: number, toIndex: number]
      deleteFrame: [index: number]
      setCurrentFrame: [index: number, oldIndex: number]
    }
  }
}

export default defineMixin((editor) => {
  const {
    doc,
    root,
    rootAabb,
    currentFrameIndex,
    frameThumbs,
    emit,
    selection,
    frames,
    config,
  } = editor

  function addFrame(value: Element = {}, toIndex?: number): void {
    const element = normalizeElement({
      ...value,
      id: undefined,
      name: 'Frame',
      meta: {
        ...value.meta,
        inEditorIs: 'Frame',
      },
    })

    element.style ??= {}
    element.style.left = rootAabb.value.left + rootAabb.value.width + config.value.frameGap
    element.style.width ||= rootAabb.value.width
    element.style.height ||= rootAabb.value.height

    const index = toIndex ?? (
      currentFrameIndex.value > -1
        ? currentFrameIndex.value + 1
        : frames.value.length - 1
    )
    doc.value.addNode(element, { index })
    setCurrentFrame(index)
    emit('addFrame', index)
  }

  function duplicateFrame(index = currentFrameIndex.value): void {
    const page = root.value.children[index]
    if (!page)
      return
    doc.value.addNode(page.toJSON(), {
      index: index + 1,
      regenId: true,
    })
    emit('duplicateFrame', index)
  }

  function moveFrame(fromIndex: number, toIndex: number): void {
    const id = root.value.children[fromIndex]?.id
    if (!id)
      return
    doc.value.moveNode(id, toIndex)
    frameThumbs.value.splice(
      toIndex,
      0,
      frameThumbs.value.splice(fromIndex, 1)[0],
    )
    setCurrentFrame(toIndex)
    emit('moveFrame', fromIndex, toIndex)
  }

  function deleteFrame(index = currentFrameIndex.value): void {
    if (!root.value || root.value.children.length === 1) {
      return
    }
    const id = root.value.children[index]?.id
    if (!id)
      return
    doc.value.deleteNode(id)
    frameThumbs.value.splice(index, 1)
    setCurrentFrame(index)
    emit('deleteFrame', index)
  }

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
    addFrame,
    duplicateFrame,
    moveFrame,
    deleteFrame,
    setCurrentFrame,
    handleElementInsideFrame,
  })
})

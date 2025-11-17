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
    doc.value.addElement(element, { index })
    setCurrentFrame(index)
    emit('addFrame', index)
  }

  function duplicateFrame(index = currentFrameIndex.value): void {
    const page = root.value.children[index]
    if (!page)
      return
    doc.value.addElement(page.toJSON(), {
      index: index + 1,
      regenId: true,
    })
    emit('duplicateFrame', index)
  }

  function moveFrame(fromIndex: number, toIndex: number): void {
    const id = root.value.children[fromIndex]?.id
    if (!id)
      return
    doc.value.moveElement(id, toIndex)
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
    doc.value.deleteElement(id)
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

  Object.assign(editor, {
    addFrame,
    duplicateFrame,
    moveFrame,
    deleteFrame,
    setCurrentFrame,
  })
})

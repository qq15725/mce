import type { Element } from 'modern-idoc'
import { normalizeElement } from 'modern-idoc'
import { defineProvider } from '../editor'

declare global {
  namespace Mce {
    interface Editor {
      addFrame: (element?: Element, toIndex?: number) => void
      duplicateFrame: (index?: number) => void
      moveFrame: (fromIndex: number, toIndex: number) => void
      deleteFrame: (index?: number) => void
      setActiveFrame: (index?: number) => void
    }

    interface Events {
      addFrame: [index: number]
      duplicateFrame: [index: number]
      moveFrame: [fromIndex: number, toIndex: number]
      deleteFrame: [index: number]
      setActiveFrame: [index: number, oldIndex: number]
    }
  }
}

export default defineProvider((editor) => {
  const {
    provideProperties,
    docModel,
    root,
    rootAabb,
    activeFrameIndex,
    frameThumbs,
    emit,
    setActiveElement,
    setSelectedElements,
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
      activeFrameIndex.value > -1
        ? activeFrameIndex.value + 1
        : frames.value.length - 1
    )
    docModel.value?.addElement(element, { index })
    setActiveFrame(index)
    emit('addFrame', index)
  }

  function duplicateFrame(index = activeFrameIndex.value): void {
    const page = root.value?.children[index]
    if (!page)
      return
    docModel.value?.addElement(page.toJSON(), {
      index: index + 1,
      regenerateId: true,
    })
    emit('duplicateFrame', index)
  }

  function moveFrame(fromIndex: number, toIndex: number): void {
    const id = root.value?.children[fromIndex]?.id
    if (!id)
      return
    docModel.value?.moveElement(id, toIndex)
    frameThumbs.value.splice(
      toIndex,
      0,
      frameThumbs.value.splice(fromIndex, 1)[0],
    )
    setActiveFrame(toIndex)
    emit('moveFrame', fromIndex, toIndex)
  }

  function deleteFrame(index = activeFrameIndex.value): void {
    if (!root.value || root.value.children.length === 1) {
      return
    }
    const id = root.value.children[index]?.id
    if (!id)
      return
    docModel.value?.deleteElement(id)
    frameThumbs.value.splice(index, 1)
    setActiveFrame(index)
    emit('deleteFrame', index)
  }

  function setActiveFrame(index = activeFrameIndex.value): void {
    index = Math.max(0, Math.min(frames.value.length - 1, index))
    const oldIndex = activeFrameIndex.value
    activeFrameIndex.value = index
    if (config.value.viewMode === 'edgeless') {
      setActiveElement(frames.value[index])
    }
    else {
      setActiveElement(undefined)
    }
    setSelectedElements([])
    emit('setActiveFrame', index, oldIndex)
  }

  provideProperties({
    addFrame,
    duplicateFrame,
    moveFrame,
    deleteFrame,
    setActiveFrame,
  })
})

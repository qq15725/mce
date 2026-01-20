import type { Element2D } from 'modern-canvas'
import { defineMixin } from '../mixin'

declare global {
  namespace Mce {
    interface Editor {
      findFrame: (target: 'next' | 'previous') => Element2D | undefined
    }
  }
}

export default defineMixin((editor) => {
  const {
    frames,
    isTopFrame,
    selection,
    getAncestorFrame,
  } = editor

  function findFrame(target: 'next' | 'previous'): Element2D | undefined {
    let current: Element2D | undefined
    const node = selection.value[0]
    if (node) {
      current = isTopFrame(node)
        ? node
        : getAncestorFrame(node, true)
    }
    const last = frames.value.length - 1
    let index = frames.value.findIndex(node => node.equal(current))
    switch (target) {
      case 'next':
        index--
        if (index < 0) {
          index = last
        }
        break
      case 'previous':
        index++
        if (index > last) {
          index = 0
        }
        break
    }
    return frames.value[index]
  }

  Object.assign(editor, {
    findFrame,
  })
})

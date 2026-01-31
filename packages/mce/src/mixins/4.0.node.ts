import type { Node } from 'modern-canvas'
import { defineMixin } from '../mixin'

declare global {
  namespace Mce {
    interface Editor {
      findSibling: (target: 'previous' | 'next') => Node | undefined
    }
  }
}

export default defineMixin((editor) => {
  const {
    root,
    selection,
  } = editor

  function findSibling(target: 'next' | 'previous'): Node | undefined {
    const node = selection.value[0]
    let value, parent
    if (node) {
      parent = node.parent
    }
    else {
      parent = root.value
    }
    switch (target) {
      case 'previous':
        if (node) {
          value = node.nextSibling
        }
        if (!value && parent) {
          value = parent.children[0]
        }
        break
      case 'next':
        if (node) {
          value = node.previousSibling
        }
        if (!value && parent) {
          value = parent.children[parent.children.length - 1]
        }
        break
    }
    if (value && (!node || !node.equal(value))) {
      return value
    }
    return undefined
  }

  Object.assign(editor, {
    findSibling,
  })
})

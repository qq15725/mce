import type { Node } from 'modern-canvas'
import type { Element } from 'modern-idoc'
import { defineMixin } from '../mixin'

declare global {
  namespace Mce {
    export interface AddNodeOptions {
      parent?: Node
      index?: number
      active?: boolean
      regenId?: boolean
    }

    interface Editor {
      findSibling: (target: 'previous' | 'next') => Node | undefined
      addNode: (value: Element, options?: AddNodeOptions) => Node
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

  function addNode(value: Element, options: Mce.AddNodeOptions = {}): Node {
    const {
      parent,
      index,
      active,
      regenId,
    } = options

    const node = root.value.addNode(value, {
      parentId: parent?.id,
      index,
      regenId,
    })

    if (active) {
      selection.value = [node]
    }

    return node
  }

  Object.assign(editor, {
    findSibling,
    addNode,
  })
})

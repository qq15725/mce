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
    doc,
    selection,
  } = editor

  function findSibling(target: 'next' | 'previous'): Node | undefined {
    const node = selection.value[0]
    if (node) {
      let value
      switch (target) {
        case 'previous':
          value = node.nextSibling
          if (!value && node.parent) {
            value = node.parent.children[0]
          }
          break
        case 'next':
          value = node.previousSibling
          if (!value && node.parent) {
            value = node.parent.children[node.parent.children.length - 1]
          }
          break
      }
      if (value && !node.equal(value)) {
        return value
      }
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

    const node = doc.value.addNode(value, {
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

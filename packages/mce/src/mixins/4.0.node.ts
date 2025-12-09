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
      addNode: (value: Element, options?: AddNodeOptions) => Node
    }
  }
}

export default defineMixin((editor) => {
  const {
    doc,
    selection,
  } = editor

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
    addNode,
  })
})

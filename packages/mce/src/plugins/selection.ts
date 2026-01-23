import type { Element2D, Node } from 'modern-canvas'
import ScrollToSelection from '../components/ScrollToSelection.vue'
import Selection from '../components/Selection.vue'
import { definePlugin } from '../plugin'

declare global {
  namespace Mce {
    type SelectTarget
      = | 'none'
        | 'all'
        | 'inverse'
        | 'children'
        | 'parent'
        | 'previousSibling'
        | 'nextSibling'
        | Node[]

    interface Commands {
      select: (target: SelectTarget) => void
      selectAll: () => void
      selectInverse: () => void
      selectNone: () => void
      selectChildren: () => void
      selectParent: () => void
      selectPreviousSibling: () => void
      selectNextSibling: () => void
      groupSelection: () => void
      ungroupSelection: () => void
      frameSelection: () => void
      showOrHideSelection: (target?: 'show' | 'hide') => void
      lockOrUnlockSelection: (target?: 'lock' | 'unlock') => void
    }

    interface Hotkeys {
      selectAll: [event: KeyboardEvent]
      selectInverse: [event: KeyboardEvent]
      selectNone: [event: KeyboardEvent]
      selectChildren: [event: KeyboardEvent]
      selectParent: [event: KeyboardEvent]
      selectPreviousSibling: [event: KeyboardEvent]
      selectNextSibling: [event: KeyboardEvent]
      groupSelection: [event: KeyboardEvent]
      ungroupSelection: [event: KeyboardEvent]
      frameSelection: [event: KeyboardEvent]
      showOrHideSelection: [event: KeyboardEvent]
      lockOrUnlockSelection: [event: KeyboardEvent]
    }

    interface Slots {
      'selection'?: () => void
      'selection.transform'?: () => void
    }

    type TransformHandleDirection = 't' | 'l' | 'r' | 'b'
    type TransformHandleCorner = 'tl' | 'tr' | 'bl' | 'br'
    type TransformHandle
      = | 'move'
        | `resize-${TransformHandleDirection | TransformHandleCorner}`
        | `rotate-${TransformHandleCorner}`
        | `round-${TransformHandleCorner}`

    interface SelectionTransformContext {
      startEvent: MouseEvent | PointerEvent
      handle: TransformHandle
      elements: Element2D[]
    }

    interface Events {
      selectionTransformStart: [context: SelectionTransformContext]
      selectionTransform: [context: SelectionTransformContext]
      selectionTransformEnd: [context: SelectionTransformContext]
    }
  }
}

export default definePlugin((editor) => {
  const {
    isElement,
    selection,
    elementSelection,
    getObb,
    getAabb,
    doc,
    root,
    findSibling,
    inEditorIs,
    addElement,
    addElements,
    obbToFit,
    setVisible,
    isVisible,
    setLock,
    isLock,
    exec,
  } = editor

  function select(target: Mce.SelectTarget) {
    switch (target) {
      case 'none':
        selection.value = []
        break
      case 'all':
        selection.value = [...root.value.children]
        break
      case 'inverse':
        selection.value = []
        break
      case 'children': {
        const children = selection.value[0]?.children
        if (children?.length) {
          selection.value = [...children]
        }
        break
      }
      case 'parent': {
        const parent = selection.value[0]?.parent
        if (isElement(parent)) {
          selection.value = [parent]
        }
        break
      }
      case 'previousSibling':
      case 'nextSibling': {
        const value = findSibling(target === 'previousSibling' ? 'previous' : 'next')
        if (value) {
          selection.value = [value]
          exec('zoomTo', 'selection', {
            intoView: true,
            behavior: 'smooth',
          })
        }
        break
      }
      default:
        selection.value = target
        break
    }
  }

  function groupSelection(inEditorIs: 'Element' | 'Frame'): void {
    const elements = elementSelection.value
    if (!elements.length) {
      return
    }
    const element = elements[0]
    const parent = element.parent
    const aabb = getAabb(elements, 'parent')
    const children = elements.map((child) => {
      const cloned = child.toJSON()
      cloned.style.left = child.style.left - aabb.left
      cloned.style.top = child.style.top - aabb.top
      return cloned
    })
    doc.value.transact(() => {
      addElement({
        name: inEditorIs === 'Frame' ? 'Frame' : 'Group',
        style: {
          left: aabb.left,
          top: aabb.top,
          width: aabb.width,
          height: aabb.height,
        },
        children,
        meta: {
          inPptIs: 'GroupShape',
          inEditorIs,
        },
      }, {
        parent,
        index: parent ? element.getIndex() : undefined,
        active: true,
        regenId: true,
      })
      elements.forEach(node => node.remove())
    })
  }

  function ungroupSelection() {
    const element = elementSelection.value[0]
    if (!element || !element.children.length)
      return
    const parent = getObb(element, 'parent')
    const items = element.children.map((child) => {
      const obb = getObb(child, 'parent')
      const cloned = child.toJSON()
      cloned.style.left = obb.left + parent.left
      cloned.style.top = obb.top + parent.top
      return cloned
    })
    doc.value.transact(() => {
      addElements(items, {
        parent: element.parent,
        index: element.getIndex(),
        active: true,
        regenId: true,
      })
      element.remove()
    })
  }

  function showOrHideSelection(target?: 'show' | 'hide'): void {
    elementSelection.value.forEach((el) => {
      switch (target) {
        case 'show':
          setVisible(el, true)
          break
        case 'hide':
          setVisible(el, false)
          break
        default:
          setVisible(el, !isVisible(el))
          break
      }
    })
  }

  function lockOrUnlockSelection(target?: 'lock' | 'unlock'): void {
    selection.value.forEach((el) => {
      switch (target) {
        case 'lock':
          setLock(el, true)
          break
        case 'unlock':
          setLock(el, false)
          break
        default:
          setLock(el, !isLock(el))
          break
      }
    })
  }

  return {
    name: 'mce:selection',
    commands: [
      { command: 'select', handle: select },
      { command: 'selectAll', handle: () => select('all') },
      { command: 'selectInverse', handle: () => select('inverse') },
      { command: 'selectNone', handle: () => select('none') },
      { command: 'selectChildren', handle: () => select('children') },
      { command: 'selectParent', handle: () => select('parent') },
      { command: 'selectPreviousSibling', handle: () => select('previousSibling') },
      { command: 'selectNextSibling', handle: () => select('nextSibling') },
      { command: 'groupSelection', handle: () => groupSelection('Element') },
      { command: 'ungroupSelection', handle: ungroupSelection },
      { command: 'frameSelection', handle: () => groupSelection('Frame') },
      { command: 'showOrHideSelection', handle: showOrHideSelection },
      { command: 'lockOrUnlockSelection', handle: lockOrUnlockSelection },
    ],
    hotkeys: [
      { command: 'selectAll', key: 'CmdOrCtrl+A' },
      { command: 'selectInverse', key: 'Shift+CmdOrCtrl+A' },
      { command: 'selectNone', key: 'Esc' },
      { command: 'selectChildren', key: 'Enter' },
      { command: 'selectParent', key: '\\' },
      { command: 'selectPreviousSibling', key: 'Shift+Tab' },
      { command: 'selectNextSibling', key: 'Tab' },
      { command: 'groupSelection', key: 'CmdOrCtrl+G' },
      { command: 'ungroupSelection', key: 'CmdOrCtrl+Backspace' },
      { command: 'frameSelection', key: 'Alt+CmdOrCtrl+G' },
      { command: 'showOrHideSelection', key: 'Shift+CmdOrCtrl+H' },
      { command: 'lockOrUnlockSelection', key: 'Shift+CmdOrCtrl+L' },
    ],
    events: {
      selectionTransform: ({ elements }) => {
        elements.forEach((el) => {
          el.findAncestor((ancestor) => {
            if (
              isElement(ancestor)
              && !inEditorIs(ancestor, 'Frame')
            ) {
              obbToFit(ancestor)
            }
            return false
          })
        })
      },
    },
    components: [
      { slot: 'selection', type: 'overlay', component: Selection },
      { type: 'overlay', component: ScrollToSelection },
    ],
  }
})

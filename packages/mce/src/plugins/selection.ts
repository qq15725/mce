import type { Aabb2D, Element2D, Node } from 'modern-canvas'
import { Obb2D } from 'modern-canvas'
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
      startTransform: (event?: MouseEvent) => boolean
      select: (target: SelectTarget) => void
      marqueeSelect: (marquee?: Aabb2D) => void
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
      'selection.foreground-cropper'?: (props: { scale: number, setScale: (scale: number) => void, setAspectRatio: (aspectRatio: 0 | [number, number]) => void, ok: () => void, cancel: () => void }) => void
    }

    interface Events {
      selectionTransformStart: [context: TransformContext]
      selectionTransform: [context: TransformMoveContext]
      selectionTransformEnd: [context: TransformContext]
    }
  }
}

export default definePlugin((editor) => {
  const {
    isElement,
    selection,
    selectionMarquee,
    elementSelection,
    getObb,
    getAabb,
    root,
    findSibling,
    inEditorIs,
    isFrameNode,
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
        const sibling = findSibling(target === 'previousSibling' ? 'previous' : 'next')
        if (sibling) {
          selection.value = [sibling]
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

  function marqueeSelect(marquee = selectionMarquee.value): void {
    const area = new Obb2D(marquee) // TODO
    selection.value = root.value
      ?.children
      .flatMap((node) => {
        if (
          isFrameNode(node, true)
          && !area.contains(getObb(node, 'drawboard'))
        ) {
          return node.children as unknown as Element2D[]
        }
        return [node] as Element2D[]
      })
      .filter((node) => {
        return 'isVisibleInTree' in node
          && node.isVisibleInTree()
          && getObb(node, 'drawboard').overlap(area)
          && !isLock(node)
          && !node.findAncestor(ancestor => isLock(ancestor))
      }) ?? []
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
    root.value.transact(() => {
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
    root.value.transact(() => {
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
      { command: 'marqueeSelect', handle: marqueeSelect },
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
      clearDoc: () => select('none'),
      selectionTransform: () => {
        elementSelection.value.forEach((el) => {
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

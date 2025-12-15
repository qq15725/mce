import { definePlugin } from '../plugin'

declare global {
  namespace Mce {
    interface Commands {
      groupSelection: () => void
      frameSelection: () => void
      ungroup: () => void
    }

    interface Hotkeys {
      groupSelection: [event: KeyboardEvent]
      frameSelection: [event: KeyboardEvent]
      ungroup: [event: KeyboardEvent]
    }
  }
}

export default definePlugin((editor) => {
  const {
    getObb,
    getAabb,
    elementSelection,
    addElement,
    doc,
  } = editor

  function group(inEditorIs: 'Element' | 'Frame'): void {
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
        style: { ...aabb },
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

  function ungroup() {
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
      addElement(items, {
        parent: element.parent,
        index: element.getIndex(),
        active: true,
        regenId: true,
      })
      element.remove()
    })
  }

  return {
    name: 'mce:group',
    commands: [
      { command: 'groupSelection', handle: () => group('Element') },
      { command: 'frameSelection', handle: () => group('Frame') },
      { command: 'ungroup', handle: ungroup },
    ],
    hotkeys: [
      { command: 'groupSelection', key: 'CmdOrCtrl+g' },
      { command: 'frameSelection', key: 'Alt+CmdOrCtrl+g' },
      { command: 'ungroup', key: 'CmdOrCtrl+Backspace' },
    ],
  }
})

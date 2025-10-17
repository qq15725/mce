import { definePlugin } from '../editor'

declare global {
  namespace Mce {
    interface Commands {
      'group': () => void
      'ungroup': () => void
      'group/ungroup': () => void
    }

    interface Hotkeys {
      'group/ungroup': [event: KeyboardEvent]
    }
  }
}

export default definePlugin((editor) => {
  const {
    getObb,
    getAabb,
    selectedElements,
    activeElement,
    registerHotkey,
    addElement,
    deleteElement,
    registerCommand,
    doc,
  } = editor

  registerCommand([
    { key: 'group', handle: group },
    { key: 'ungroup', handle: ungroup },
    { key: 'group/ungroup', handle: groupOrUngroup },
  ])

  registerHotkey([
    { key: 'group/ungroup', accelerator: 'CmdOrCtrl+g', editable: false },
  ])

  function group(): void {
    const elements = selectedElements.value
    if (elements.length === 0) {
      return
    }
    const aabb = getAabb(elements, 'frame')
    const children = elements.map((v) => {
      const cloned = v.toJSON()
      cloned.style.left = (cloned.style.left ?? 0) - aabb.left
      cloned.style.top = (cloned.style.top ?? 0) - aabb.top
      return cloned
    })
    doc.value?.transact(() => {
      addElement({
        style: { ...aabb },
        children,
        meta: {
          inPptIs: 'GroupShape',
        },
      }, {
        active: true,
        regenId: true,
      })
      elements.forEach(v => deleteElement(v.id))
    })
  }

  function ungroup() {
    const element = activeElement.value
    if (!element)
      return
    const items = element.children.map((child) => {
      const obb = getObb(child, 'frame')
      const cloned = child.toJSON()
      cloned.style.left = obb.left
      cloned.style.top = obb.top
      return cloned
    })
    doc.value?.transact(() => {
      addElement(items, {
        active: true,
        regenId: true,
      })
      deleteElement(element.id)
    })
  }

  function groupOrUngroup() {
    if (activeElement.value?.children.length) {
      ungroup()
    }
    else {
      group()
    }
  }
})

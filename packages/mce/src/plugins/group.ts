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
    selection,
    addElement,
    deleteElement,
    doc,
  } = editor

  function group(): void {
    const elements = selection.value
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
    const element = selection.value[0]
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
    if (selection.value.length === 1) {
      ungroup()
    }
    else if (selection.value.length > 1) {
      group()
    }
  }

  return {
    name: 'group',
    commands: {
      group,
      ungroup,
      'group/ungroup': groupOrUngroup,
    },
    hotkeys: [
      { key: 'group/ungroup', accelerator: 'CmdOrCtrl+g', editable: false },
    ],
  }
})

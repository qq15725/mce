import { definePlugin } from '../editor'

declare global {
  namespace Mce {
    interface Commands {
      'frame': () => void
      'unframe': () => void
      'frame/unframe': () => void
    }

    interface Hotkeys {
      'frame/unframe': [event: KeyboardEvent]
    }
  }
}

export default definePlugin((editor) => {
  const {
    deleteElement,
    getAabb,
    getObb,
    selection,
    addElement,
    isFrame,
    doc,
  } = editor

  function frame(): void {
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
          inEditorIs: 'Frame',
        },
      }, {
        regenId: true,
        active: true,
      })
      elements.forEach(v => deleteElement(v.id))
    })
  }

  function unframe() {
    const element = selection.value[0]
    if (!element)
      return
    const items = element.children.map((el) => {
      const obb = getObb(el)
      const cloned = el.toJSON()
      cloned.style.left = obb.left
      cloned.style.top = obb.top
      return cloned
    })
    doc.value?.transact(() => {
      deleteElement(element.id)
      addElement(items, {
        active: true,
        regenId: true,
      })
    })
  }

  function frameOrUnframe() {
    if (selection.value.length === 1) {
      if (isFrame(selection.value[0])) {
        unframe()
      }
    }
    else if (selection.value.length > 1) {
      frame()
    }
  }

  return {
    name: 'frame',
    commands: {
      'frame': frame,
      'unframe': unframe,
      'frame/unframe': frameOrUnframe,
    },
    hotkeys: [
      { command: 'frame/unframe', key: 'CmdOrCtrl+f', editable: false },
    ],
  }
})

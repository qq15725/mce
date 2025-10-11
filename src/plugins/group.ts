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
    setActiveElement,
    setSelectedElements,
    registerHotkey,
    addElement,
    deleteElement,
    registerCommand,
  } = editor

  registerCommand([
    { key: 'group', handle: group },
    { key: 'ungroup', handle: ungroup },
    { key: 'group/ungroup', handle: groupOrUngroup },
  ])

  registerHotkey([
    { key: 'group/ungroup', accelerator: 'CmdOrCtrl+g', editable: false },
  ])

  function rmId(el: Record<string, any>): void {
    delete el.id
    el.children?.forEach((child: Record<string, any>) => rmId(child))
  }

  function group(): void {
    const elements = selectedElements.value
    if (elements.length === 0) {
      return
    }
    const aabb = getAabb(elements, 'frame')
    const children = elements.map((v) => {
      const cloned = v.toJSON()
      rmId(cloned)
      cloned.style.left -= aabb.left
      cloned.style.top -= aabb.top
      return cloned
    })
    setActiveElement(
      addElement({
        style: { ...aabb },
        children,
        meta: {
          inPptIs: 'GroupShape',
        },
      }),
    )
    elements.forEach(v => deleteElement(v.id))
  }

  function ungroup() {
    const element = activeElement.value
    if (!element)
      return
    const items = element.children.map((child) => {
      const obb = getObb(child, 'frame')
      const cloned = child.toJSON()
      rmId(cloned)
      cloned.style.left = obb.left
      cloned.style.top = obb.top
      return cloned
    })
    setSelectedElements(
      items.map(el => addElement(el)),
    )
    deleteElement(element.id)
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

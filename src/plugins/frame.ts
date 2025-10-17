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
    registerHotkey,
    registerCommand,
    deleteElement,
    setActiveElement,
    getAabb,
    getObb,
    activeElement,
    selectedElements,
    addElement,
    isFrame,
    setSelectedElements,
    doc,
  } = editor

  registerCommand([
    { key: 'frame', handle: frame },
    { key: 'unframe', handle: unframe },
    { key: 'frame/unframe', handle: frameOrUnframe },
  ])

  registerHotkey([
    { key: 'frame/unframe', accelerator: 'CmdOrCtrl+f', editable: false },
  ])

  function rmId(el: Record<string, any>): void {
    delete el.id
    el.children?.forEach((child: Record<string, any>) => rmId(child))
  }

  function frame(): void {
    const elements = selectedElements.value
    if (elements.length === 0) {
      return
    }
    const aabb = getAabb(elements, 'frame')
    const children = elements.map((v) => {
      const cloned = v.toJSON()
      rmId(cloned)
      cloned.style.left = (cloned.style.left ?? 0) - aabb.left
      cloned.style.top = (cloned.style.top ?? 0) - aabb.top
      return cloned
    })
    doc.value?.transact(() => {
      setActiveElement(
        addElement({
          style: { ...aabb },
          children,
          meta: {
            inEditorIs: 'Frame',
          },
        }),
      )
      elements.forEach(v => deleteElement(v.id))
    })
  }

  function unframe() {
    const element = activeElement.value
    if (!element)
      return
    const items = element.children.map((el) => {
      const obb = getObb(el)
      const cloned = el.toJSON()
      rmId(cloned)
      cloned.style.left = obb.left
      cloned.style.top = obb.top
      return cloned
    })
    doc.value?.transact(() => {
      deleteElement(element.id)
      setSelectedElements(items.map(el => addElement(el)))
    })
  }

  function frameOrUnframe() {
    if (activeElement.value) {
      if (isFrame(activeElement.value)) {
        unframe()
      }
    }
    else if (selectedElements.value.length > 0) {
      frame()
    }
  }
})

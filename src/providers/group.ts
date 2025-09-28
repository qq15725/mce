import { defineProvider } from '../editor'

declare global {
  namespace Mce {
    interface Commands {
      group: () => void
      ungroup: () => void
    }

    interface Hotkeys {
      group: [event: KeyboardEvent]
      ungroup: [event: KeyboardEvent]
    }
  }
}

export default defineProvider((editor) => {
  const {
    getObb,
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
  ])

  registerHotkey([
    { key: 'group', accelerator: 'CmdOrCtrl+g', editable: false },
    { key: 'ungroup', accelerator: 'Shift+CmdOrCtrl+g', editable: false },
  ])

  function group(): void {
    const elements = selectedElements.value
    const items = elements.map(v => v.toJSON())
    const obb = getObb(elements, 'frame')
    setActiveElement(
      addElement({
        style: {
          left: obb.left,
          top: obb.top,
          width: obb.width,
          height: obb.height,
        },
        children: items.map((el) => {
          delete el.id
          el.style.left -= obb.left
          el.style.top -= obb.top
          return el
        }),
        meta: {
          inPptIs: 'GroupShape',
        },
      }, {
        fitSize: false,
        fitPosition: false,
      }),
    )
    elements.forEach(v => deleteElement(v.id))
  }

  function ungroup() {
    if (!activeElement.value)
      return
    const oldElement = activeElement.value
    const elements = oldElement.children.map((child) => {
      const obb = getObb(child, 'frame')
      const element = child.toJSON()
      delete element.id
      element.style.left = obb.left
      element.style.top = obb.top
      return addElement(element, {
        fitSize: false,
        fitPosition: false,
      })
    })
    deleteElement(oldElement.id)
    setSelectedElements(elements)
  }
})

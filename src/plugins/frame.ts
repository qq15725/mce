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
    getObb,
    activeElement,
    selectedElements,
    addElement,
    isFrame,
    setSelectedElements,
  } = editor

  registerCommand([
    { key: 'frame', handle: frame },
    { key: 'unframe', handle: unframe },
    { key: 'frame/unframe', handle: frameOrUnframe },
  ])

  registerHotkey([
    { key: 'frame/unframe', accelerator: 'CmdOrCtrl+f', editable: false },
  ])

  function frame(): void {
    const elements = selectedElements.value
    if (elements.length === 0) {
      return
    }
    const children = elements.map(v => v.toJSON())
    const obb = getObb(elements, 'frame')
    setActiveElement(
      addElement({
        style: {
          left: obb.left,
          top: obb.top,
          width: obb.width,
          height: obb.height,
        },
        children: children.map((el) => {
          delete el.id
          el.style.left -= obb.left
          el.style.top -= obb.top
          return el
        }),
        meta: {
          inEditorIs: 'Frame',
        },
      }),
    )
    elements.forEach(v => deleteElement(v.id))
  }

  function unframe() {
    const element = activeElement.value
    if (!element)
      return
    const items = element.children.map((el) => {
      return {
        obb: getObb(el),
        element: el.toJSON(),
      }
    })
    deleteElement(element.id)
    setSelectedElements(
      items.map((item) => {
        const { obb, element } = item
        delete element.id
        element.style.left = obb.left
        element.style.top = obb.top
        return addElement(element)
      }),
    )
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

import { Element2D } from 'modern-canvas'
import { defineProvider } from '../editor'

declare global {
  namespace Mce {
    interface Hotkeys {
      selectAll: [event: KeyboardEvent]
      deselectAll: [event: KeyboardEvent]
      selectParent: [event: KeyboardEvent]
      previousSelection: [event: KeyboardEvent]
      nextSelection: [event: KeyboardEvent]
    }

    interface Commands {
      selectAll: () => void
      deselectAll: () => void
      selectParent: () => void
      previousSelection: () => void
      nextSelection: () => void
    }
  }
}

export default defineProvider((editor) => {
  const {
    registerHotkey,
    registerCommand,
    setSelectedElements,
    activeFrame,
    setActiveElement,
    activeElement,
  } = editor

  registerCommand([
    { key: 'selectAll', handle: selectAll },
    { key: 'deselectAll', handle: deselectAll },
    { key: 'selectParent', handle: selectParent },
    { key: 'previousSelection', handle: previousSelection },
    { key: 'nextSelection', handle: nextSelection },
  ])

  registerHotkey([
    { key: 'selectAll', accelerator: 'CmdOrCtrl+a' },
    { key: 'deselectAll', accelerator: 'Shift+CmdOrCtrl+a' },
    { key: 'selectParent', accelerator: 'Alt+\\' },
    { key: 'previousSelection', accelerator: 'Alt+[' },
    { key: 'nextSelection', accelerator: 'Alt+]' },
  ])

  function selectAll(): void {
    setSelectedElements([...activeFrame.value?.children ?? []] as Element2D[])
  }

  function deselectAll() {
    setActiveElement(undefined)
    setSelectedElements([])
  }

  function selectParent() {
    const parent = activeElement.value?.parent
    if (parent instanceof Element2D) {
      setActiveElement(parent)
      setSelectedElements([])
    }
  }

  function previousSelection() {
    const element = activeElement.value
    if (!element)
      return
    const previousSibling = element.previousSibling
    if (
      previousSibling instanceof Element2D
      && !element.equal(previousSibling)
    ) {
      setActiveElement(previousSibling)
      setSelectedElements([])
    }
  }

  function nextSelection() {
    const element = activeElement.value
    if (!element)
      return
    const nextSibling = element.nextSibling
    if (
      nextSibling instanceof Element2D
      && !element.equal(nextSibling)
    ) {
      setActiveElement(nextSibling)
      setSelectedElements([])
    }
  }
})

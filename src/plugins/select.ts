import { Element2D } from 'modern-canvas'
import { definePlugin } from '../editor'

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

export default definePlugin((editor) => {
  const {
    registerHotkey,
    registerCommand,
    selection,
    root,
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
    selection.value = [...root.value?.children ?? []] as Element2D[]
  }

  function deselectAll() {
    selection.value = []
  }

  function selectParent() {
    const parent = selection.value[0]?.parent
    if (parent instanceof Element2D) {
      selection.value = [parent]
    }
  }

  function previousSelection() {
    const element = selection.value[0]
    if (!element)
      return
    const previousSibling = element.previousSibling
    if (
      previousSibling instanceof Element2D
      && !element.equal(previousSibling)
    ) {
      selection.value = [previousSibling]
    }
  }

  function nextSelection() {
    const element = selection.value[0]
    if (!element)
      return
    const nextSibling = element.nextSibling
    if (
      nextSibling instanceof Element2D
      && !element.equal(nextSibling)
    ) {
      selection.value = [nextSibling]
    }
  }
})

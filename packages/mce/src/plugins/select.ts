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
    selection,
    root,
  } = editor

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

  return {
    name: 'mce:select',
    commands: [
      { command: 'selectAll', handle: selectAll },
      { command: 'deselectAll', handle: deselectAll },
      { command: 'selectParent', handle: selectParent },
      { command: 'previousSelection', handle: previousSelection },
      { command: 'nextSelection', handle: nextSelection },
    ],
    hotkeys: [
      { command: 'selectAll', key: 'CmdOrCtrl+a' },
      { command: 'deselectAll', key: 'Shift+CmdOrCtrl+a' },
      { command: 'selectParent', key: 'Alt+\\' },
      { command: 'previousSelection', key: 'Alt+[' },
      { command: 'nextSelection', key: 'Alt+]' },
    ],
  }
})

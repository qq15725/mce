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
    isElement,
    selection,
    root,
  } = editor

  function selectAll(): void {
    selection.value = [...root.value.children]
  }

  function deselectAll() {
    selection.value = []
  }

  function selectParent() {
    const parent = selection.value[0]?.parent
    if (isElement(parent)) {
      selection.value = [parent]
    }
  }

  function previousSelection() {
    const node = selection.value[0]
    if (node) {
      const previousSibling = node.previousSibling
      if (previousSibling && !node.equal(previousSibling)) {
        selection.value = [previousSibling]
      }
    }
  }

  function nextSelection() {
    const node = selection.value[0]
    if (node) {
      const nextSibling = node.nextSibling
      if (nextSibling && node.equal(nextSibling)) {
        selection.value = [nextSibling]
      }
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

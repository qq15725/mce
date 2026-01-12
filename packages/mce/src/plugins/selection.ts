import GoBackSelectedArea from '../components/GoBackSelectedArea.vue'
import { definePlugin } from '../plugin'

declare global {
  namespace Mce {
    interface Hotkeys {
      selectAll: [event: KeyboardEvent]
      deselectAll: [event: KeyboardEvent]
      selectParent: [event: KeyboardEvent]
      selectPreviousSibling: [event: KeyboardEvent]
      selectNextSibling: [event: KeyboardEvent]
    }

    interface Commands {
      selectAll: () => void
      deselectAll: () => void
      selectParent: () => void
      selectPreviousSibling: () => void
      selectNextSibling: () => void
    }
  }
}

export default definePlugin((editor) => {
  const {
    isElement,
    selection,
    root,
    scrollTo,
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

  function selectSibling(type: 'previous' | 'next') {
    const node = selection.value[0]
    if (node) {
      let value
      switch (type) {
        case 'previous':
          value = node.nextSibling
          if (!value && node.parent) {
            value = node.parent.children[0]
          }
          break
        case 'next':
          value = node.previousSibling
          if (!value && node.parent) {
            value = node.parent.children[node.parent.children.length - 1]
          }
          break
      }
      if (value && !node.equal(value)) {
        selection.value = [value]
        scrollTo('selection')
      }
    }
  }

  return {
    name: 'mce:selection',
    commands: [
      { command: 'selectAll', handle: selectAll },
      { command: 'deselectAll', handle: deselectAll },
      { command: 'selectParent', handle: selectParent },
      { command: 'selectPreviousSibling', handle: () => selectSibling('previous') },
      { command: 'selectNextSibling', handle: () => selectSibling('next') },
    ],
    hotkeys: [
      { command: 'selectAll', key: 'CmdOrCtrl+a' },
      { command: 'deselectAll', key: 'Shift+CmdOrCtrl+a' },
      { command: 'selectParent', key: 'Alt+\\' },
      { command: 'selectPreviousSibling', key: 'Shift+Tab' },
      { command: 'selectNextSibling', key: 'Tab' },
    ],
    components: [
      { type: 'overlay', component: GoBackSelectedArea },
    ],
  }
})

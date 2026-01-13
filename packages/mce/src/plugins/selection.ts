import GoBackSelectedArea from '../components/GoBackSelectedArea.vue'
import { definePlugin } from '../plugin'

declare global {
  namespace Mce {
    interface Hotkeys {
      selectAll: [event: KeyboardEvent]
      deselectAll: [event: KeyboardEvent]
      selectChildren: [event: KeyboardEvent]
      selectParent: [event: KeyboardEvent]
      selectPreviousSibling: [event: KeyboardEvent]
      selectNextSibling: [event: KeyboardEvent]
    }

    interface Commands {
      selectAll: () => void
      deselectAll: () => void
      selectChildren: () => void
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
    findSibling,
  } = editor

  function selectAll(): void {
    selection.value = [...root.value.children]
  }

  function deselectAll() {
    selection.value = []
  }

  function selectChildren() {
    const children = selection.value[0]?.children
    if (children?.length) {
      selection.value = [...children]
    }
  }

  function selectParent() {
    const parent = selection.value[0]?.parent
    if (isElement(parent)) {
      selection.value = [parent]
    }
  }

  function selectSibling(type: 'previous' | 'next') {
    const value = findSibling(type)
    if (value) {
      selection.value = [value]
      scrollTo('selection', {
        intoView: true,
        behavior: 'smooth',
      })
    }
  }

  return {
    name: 'mce:selection',
    commands: [
      { command: 'selectAll', handle: selectAll },
      { command: 'deselectAll', handle: deselectAll },
      { command: 'selectChildren', handle: selectChildren },
      { command: 'selectParent', handle: selectParent },
      { command: 'selectPreviousSibling', handle: () => selectSibling('previous') },
      { command: 'selectNextSibling', handle: () => selectSibling('next') },
    ],
    hotkeys: [
      { command: 'selectAll', key: 'CmdOrCtrl+a' },
      { command: 'deselectAll', key: 'Shift+CmdOrCtrl+a' },
      { command: 'selectChildren', key: 'Enter' },
      { command: 'selectParent', key: '\\' },
      { command: 'selectPreviousSibling', key: 'Shift+Tab' },
      { command: 'selectNextSibling', key: 'Tab' },
    ],
    components: [
      { type: 'overlay', component: GoBackSelectedArea },
    ],
  }
})

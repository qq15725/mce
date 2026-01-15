import type { Ref } from 'vue'
import { ref } from 'vue'
import { definePlugin } from '../plugin'

declare global {
  namespace Mce {
    interface Editor {
      canUndo: Ref<boolean>
      canRedo: Ref<boolean>
      undo: () => void
      redo: () => void
    }

    interface Hotkeys {
      undo: [event: KeyboardEvent]
      redo: [event: KeyboardEvent]
    }

    interface Commands {
      undo: () => void
      redo: () => void
    }
  }
}

export default definePlugin((editor) => {
  const {
    doc,
    on,
  } = editor

  const canUndo = ref(false)
  const canRedo = ref(false)

  function redo(): void {
    doc.value.redo()
  }

  function undo(): void {
    doc.value.undo()
  }

  on('setDoc', (doc) => {
    doc.on('history', (um) => {
      canUndo.value = um.canUndo()
      canRedo.value = um.canRedo()
    })
  })

  Object.assign(editor, {
    canUndo,
    canRedo,
    redo,
    undo,
  })

  return {
    name: 'mce:history',
    commands: [
      { command: 'undo', handle: undo },
      { command: 'redo', handle: redo },
    ],
    hotkeys: [
      { command: 'undo', key: 'CmdOrCtrl+Z' },
      { command: 'redo', key: 'Shift+CmdOrCtrl+Z' },
    ],
  }
})

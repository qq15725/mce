import type { Ref } from 'vue'
import { ref } from 'vue'
import { definePlugin } from '../editor'

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
    registerHotkey,
    registerCommand,
  } = editor

  registerCommand([
    { key: 'undo', handle: undo },
    { key: 'redo', handle: redo },
  ])

  registerHotkey([
    { key: 'undo', accelerator: 'CmdOrCtrl+z' },
    { key: 'redo', accelerator: 'Shift+CmdOrCtrl+z' },
  ])

  const canUndo = ref(false)
  const canRedo = ref(false)

  function redo(): void {
    doc.value?.redo()
  }

  function undo(): void {
    doc.value?.undo()
  }

  Object.assign(editor, {
    canUndo,
    canRedo,
    redo,
    undo,
  })

  return () => {
    const {
      on,
    } = editor

    on('setDoc', (doc) => {
      doc.on('history', (um) => {
        canUndo.value = um.canUndo()
        canRedo.value = um.canRedo()
      })
    })
  }
})

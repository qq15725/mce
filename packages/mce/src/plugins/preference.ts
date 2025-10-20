import type { Ref } from 'vue'
import { ref } from 'vue'
import { definePlugin } from '../editor'

declare global {
  namespace Mce {
    interface Commands {
      preferences: () => void
    }

    interface Hotkeys {
      preferences: [event: KeyboardEvent]
    }

    interface Editor {
      preferencesVisible: Ref<boolean>
    }
  }
}

export default definePlugin((editor) => {
  const {
    registerCommand,
    registerHotkey,
  } = editor

  const preferencesVisible = ref(false)

  registerCommand([
    { key: 'preferences', handle: preferences },
  ])

  registerHotkey([
    { key: 'preferences', accelerator: 'CmdOrCtrl+,', editable: false, system: true },
  ])

  function preferences() {
    preferencesVisible.value = !preferencesVisible.value
  }

  Object.assign(editor, {
    preferencesVisible,
  })
})

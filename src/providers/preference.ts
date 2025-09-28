import type { Ref } from 'vue'
import { ref } from 'vue'
import { defineProvider } from '../editor'

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

export default defineProvider((editor) => {
  const {
    provideProperties,
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

  provideProperties({
    preferencesVisible,
  })
})

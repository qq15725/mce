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
  const preferencesVisible = ref(false)

  function preferences() {
    preferencesVisible.value = !preferencesVisible.value
  }

  Object.assign(editor, {
    preferencesVisible,
  })

  return {
    name: 'mce:preferences',
    commands: [
      { command: 'preferences', handle: preferences },
    ],
    hotkeys: [
      { command: 'preferences', key: 'CmdOrCtrl+,', editable: false, system: true },
    ],
  }
})

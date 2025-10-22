import { definePlugin } from '../editor'

declare global {
  namespace Mce {
    interface Commands {
      delete: () => void
    }

    interface Hotkeys {
      delete: [event: KeyboardEvent]
    }
  }
}

export default definePlugin((editor) => {
  const {
    deleteCurrentElements,
    selection,
  } = editor

  const when = (): boolean => Boolean(selection.value.length > 0)

  return {
    name: 'delete',
    commands: [
      { command: 'delete', handle: deleteCurrentElements },
    ],
    hotkeys: [
      { command: 'delete', key: ['Backspace', 'Delete'], when },
    ],
  }
})

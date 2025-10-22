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
    deleteElement,
    selection,
    hoverElement,
  } = editor

  function _delete() {
    if (selection.value.length) {
      selection.value.forEach((element) => {
        deleteElement(element.id)
      })
      selection.value = []
    }
    hoverElement.value = undefined
  }

  const when = (): boolean => Boolean(selection.value.length > 0)

  return {
    name: 'delete',
    commands: [
      { command: 'delete', handle: _delete },
    ],
    hotkeys: [
      { command: 'delete', key: ['Backspace', 'Delete'], when },
    ],
  }
})

import { definePlugin } from '../plugin'

declare global {
  namespace Mce {
    interface Commands {
      enter: () => void
    }

    interface Hotkeys {
      enter: [event: KeyboardEvent]
    }
  }
}

export default definePlugin((editor) => {
  const {
    selection,
    isElement,
    exec,
  } = editor

  async function _enter() {
    if (selection.value.length === 1) {
      const node = selection.value[0]
      if (isElement(node)) {
        if (node.text.isValid()) {
          await exec('startTyping')
        }
      }
    }
  }

  const when = (): boolean => Boolean(selection.value.length > 0)

  return {
    name: 'mce:enter',
    commands: [
      { command: 'enter', handle: _enter },
    ],
    hotkeys: [
      { command: 'enter', key: ['Enter'], when },
    ],
  }
})

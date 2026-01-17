import { definePlugin } from '../plugin'

declare global {
  namespace Mce {
    interface Commands {
      enter: () => void
      flipHorizontal: () => void
      flipVertical: () => void
    }

    interface Hotkeys {
      enter: [event: KeyboardEvent]
      flipHorizontal: [event: KeyboardEvent]
      flipVertical: [event: KeyboardEvent]
    }
  }
}

export default definePlugin((editor) => {
  const {
    elementSelection,
    exec,
  } = editor

  async function _enter() {
    if (elementSelection.value.length === 1) {
      const element = elementSelection.value[0]
      if (element.text.isValid()) {
        await exec('startTyping')
      }
    }
  }

  const when = (): boolean => Boolean(elementSelection.value.length > 0)

  function flipHorizontal() {
    elementSelection.value.forEach((el) => {
      el.style.scaleX = -el.style.scaleX
    })
  }

  function flipVertical() {
    elementSelection.value.forEach((el) => {
      el.style.scaleY = -el.style.scaleY
    })
  }

  return {
    name: 'mce:transform',
    commands: [
      { command: 'enter', handle: _enter },
      { command: 'flipHorizontal', handle: flipHorizontal },
      { command: 'flipVertical', handle: flipVertical },
    ],
    hotkeys: [
      { command: 'enter', key: ['Enter'], when },
      { command: 'flipHorizontal', key: 'Shift+H' },
      { command: 'flipVertical', key: 'Shift+V' },
    ],
  }
})

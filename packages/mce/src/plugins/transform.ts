import { definePlugin } from '../plugin'

declare global {
  namespace Mce {
    type FlipTarget
      = | 'horizontal'
        | 'vertical'

    interface Commands {
      enter: () => void
      flip: (target: Mce.FlipTarget) => void
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

  function flip(target: Mce.FlipTarget) {
    switch (target) {
      case 'horizontal':
        elementSelection.value.forEach((el) => {
          el.style.scaleX = -el.style.scaleX
        })
        break
      case 'vertical':
        elementSelection.value.forEach((el) => {
          el.style.scaleY = -el.style.scaleY
        })
        break
    }
  }

  return {
    name: 'mce:transform',
    commands: [
      { command: 'enter', handle: _enter },
      { command: 'flip', handle: flip },
      { command: 'flipHorizontal', handle: () => flip('horizontal') },
      { command: 'flipVertical', handle: () => flip('vertical') },
    ],
    hotkeys: [
      { command: 'enter', key: ['Enter'], when },
      { command: 'flipHorizontal', key: 'Shift+H' },
      { command: 'flipVertical', key: 'Shift+V' },
    ],
  }
})

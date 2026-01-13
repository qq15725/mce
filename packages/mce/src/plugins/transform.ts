import { definePlugin } from '../plugin'

declare global {
  namespace Mce {
    interface Commands {
      flipHorizontal: () => void
      flipVertical: () => void
    }
  }
}

export default definePlugin((editor) => {
  const {
    elementSelection,
  } = editor

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
      { command: 'flipHorizontal', handle: flipHorizontal },
      { command: 'flipVertical', handle: flipVertical },
    ],
    hotkeys: [
      { command: 'flipHorizontal', key: 'Shift+h' },
      { command: 'flipVertical', key: 'Shift+v' },
    ],
  }
})

import { definePlugin } from '../editor'

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
    selection,
  } = editor

  function flipHorizontal() {
    selection.value.forEach((el) => {
      el.style.scaleX = -el.style.scaleX
    })
  }

  function flipVertical() {
    selection.value.forEach((el) => {
      el.style.scaleY = -el.style.scaleY
    })
  }

  return {
    name: 'mce:flip',
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

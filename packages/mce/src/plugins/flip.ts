import { definePlugin } from '../editor'

declare global {
  namespace Mce {
    interface Commands {
      flipX: () => void
      flipY: () => void
    }
  }
}

export default definePlugin((editor) => {
  const {
    selection,
  } = editor

  function flipX() {
    selection.value.forEach((el) => {
      el.style.scaleX = -el.style.scaleX
    })
  }

  function flipY() {
    selection.value.forEach((el) => {
      el.style.scaleY = -el.style.scaleY
    })
  }

  return {
    name: 'flip',
    commands: [
      { command: 'flipX', handle: flipX },
      { command: 'flipY', handle: flipY },
    ],
  }
})

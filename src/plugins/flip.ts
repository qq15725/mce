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
    registerCommand,
    currentElements,
  } = editor

  registerCommand([
    { key: 'flipX', handle: flipX },
    { key: 'flipY', handle: flipY },
  ])

  function flipX() {
    currentElements.value.forEach((el) => {
      el.style.scaleX = -el.style.scaleX
    })
  }

  function flipY() {
    currentElements.value.forEach((el) => {
      el.style.scaleY = -el.style.scaleY
    })
  }
})

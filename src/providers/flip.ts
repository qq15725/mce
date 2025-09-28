import { defineProvider } from '../editor'

declare global {
  namespace Mce {
    interface Commands {
      horizontal: () => void
      vertical: () => void
    }
  }
}

export default defineProvider((editor) => {
  const {
    registerCommand,
    currentElements,
  } = editor

  registerCommand([
    { key: 'horizontal', handle: horizontal },
    { key: 'vertical', handle: vertical },
  ])

  function horizontal() {
    currentElements.value.forEach((el) => {
      el.style.scaleX = -el.style.scaleX
    })
  }

  function vertical() {
    currentElements.value.forEach((el) => {
      el.style.scaleY = -el.style.scaleY
    })
  }
})

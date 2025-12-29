import { definePlugin } from '../plugin'

declare global {
  namespace Mce {
    interface Commands {
      rotate: (deg: number) => void
      rotate90: () => void
    }
  }
}

export default definePlugin((editor) => {
  const {
    elementSelection,
  } = editor

  function rotate(deg: number) {
    elementSelection.value.forEach((el) => {
      el.style.rotate += deg
    })
  }

  return {
    name: 'mce:rotate',
    commands: [
      { command: 'rotate', handle: rotate },
      { command: 'rotate90', handle: () => rotate(90) },
    ],
  }
})

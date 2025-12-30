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
      el.style.rotate = (el.style.rotate + deg) % 360
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

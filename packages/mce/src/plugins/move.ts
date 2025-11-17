import { definePlugin } from '../plugin'

declare global {
  namespace Mce {
    type MoveCommandDirection = 'left' | 'top' | 'right' | 'bottom'

    interface Commands {
      move: (direction: MoveCommandDirection, distance?: number) => void
      moveLeft: (distance?: number) => void
      moveTop: (distance?: number) => void
      moveRight: (distance?: number) => void
      moveBottom: (distance?: number) => void
    }

    interface Hotkeys {
      moveLeft: [event: KeyboardEvent]
      moveTop: [event: KeyboardEvent]
      moveRight: [event: KeyboardEvent]
      moveBottom: [event: KeyboardEvent]
    }
  }
}

export default definePlugin((editor) => {
  const {
    elementSelection,
  } = editor

  function move(direction: Mce.MoveCommandDirection, distance = 1): void {
    let prop: 'left' | 'top'
    switch (direction) {
      case 'left':
      case 'top':
        prop = direction
        distance = -distance
        break
      case 'bottom':
        prop = 'top'
        break
      case 'right':
        prop = 'left'
        break
    }
    elementSelection.value.forEach((element) => {
      element.style[prop] += distance
    })
  }

  function when(): boolean {
    return elementSelection.value.length > 0
  }

  return {
    name: 'mce:move',
    commands: [
      { command: 'move', handle: move },
      { command: 'moveLeft', handle: (distance?: number) => move('left', distance) },
      { command: 'moveTop', handle: (distance?: number) => move('top', distance) },
      { command: 'moveRight', handle: (distance?: number) => move('right', distance) },
      { command: 'moveBottom', handle: (distance?: number) => move('bottom', distance) },
    ],
    hotkeys: [
      { command: 'moveLeft', key: 'ArrowLeft', editable: false, when },
      { command: 'moveTop', key: 'ArrowUp', editable: false, when },
      { command: 'moveRight', key: 'ArrowRight', editable: false, when },
      { command: 'moveBottom', key: 'ArrowDown', editable: false, when },
    ],
  }
})

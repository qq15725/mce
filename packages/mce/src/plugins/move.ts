import { definePlugin } from '../editor'

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
    selection,
  } = editor

  function move(direction: Mce.MoveCommandDirection, distance = 1): void {
    let prop
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
    selection.value.forEach((element) => {
      (element.style as any)[prop] += distance
    })
  }

  function condition(): boolean {
    return selection.value.length > 0
  }

  return {
    name: 'move',
    commands: {
      move,
      moveLeft: (distance?: number) => move('left', distance),
      moveTop: (distance?: number) => move('top', distance),
      moveRight: (distance?: number) => move('right', distance),
      moveBottom: (distance?: number) => move('bottom', distance),
    },
    hotkeys: [
      { command: 'moveLeft', key: 'ArrowLeft', editable: false, condition },
      { command: 'moveTop', key: 'ArrowUp', editable: false, condition },
      { command: 'moveRight', key: 'ArrowRight', editable: false, condition },
      { command: 'moveBottom', key: 'ArrowDown', editable: false, condition },
    ],
  }
})

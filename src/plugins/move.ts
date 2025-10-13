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
    registerCommand,
    registerHotkey,
    currentElements,
  } = editor

  registerCommand([
    { key: 'move', handle: move },
    { key: 'moveLeft', handle: moveLeft },
    { key: 'moveTop', handle: moveTop },
    { key: 'moveRight', handle: moveRight },
    { key: 'moveBottom', handle: moveBottom },
  ])

  function condition(): boolean {
    return currentElements.value.length > 0
  }

  registerHotkey([
    { key: 'moveLeft', accelerator: 'ArrowLeft', editable: false, condition },
    { key: 'moveTop', accelerator: 'ArrowUp', editable: false, condition },
    { key: 'moveRight', accelerator: 'ArrowRight', editable: false, condition },
    { key: 'moveBottom', accelerator: 'ArrowDown', editable: false, condition },
  ])

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
    currentElements.value.forEach((element) => {
      (element.style as any)[prop] += distance
    })
  }

  function moveLeft(distance?: number): void {
    move('left', distance)
  }

  function moveTop(distance?: number): void {
    move('top', distance)
  }

  function moveRight(distance?: number): void {
    move('right', distance)
  }

  function moveBottom(distance?: number): void {
    move('bottom', distance)
  }
})

import type { Element2D } from 'modern-canvas'
import { definePlugin } from '../editor'

declare global {
  namespace Mce {
    interface Hotkeys {
      raiseToFront: [event: KeyboardEvent]
      raise: [event: KeyboardEvent]
      lower: [event: KeyboardEvent]
      lowerToBack: [event: KeyboardEvent]
    }

    interface Commands {
      raiseToFront: (target?: Element2D | Element2D[]) => void
      raise: (target?: Element2D) => void
      lower: (target?: Element2D) => void
      lowerToBack: (target?: Element2D | Element2D[]) => void
    }
  }
}

export default definePlugin((editor) => {
  const {
    selection,
  } = editor

  function arrange(
    target: Element2D | Element2D[],
    type: 'raise' | 'raiseToFront' | 'lower' | 'lowerToBack',
  ) {
    const els = Array.isArray(target) ? target : [target]

    els.forEach((el) => {
      const parent = el.getParent()
      if (!parent)
        return
      let index = el.getIndex()
      const front = parent.children.length - 1
      const back = 0
      switch (type) {
        case 'raise':
          index = Math.min(parent.children.length - 1, index + 1)
          break
        case 'raiseToFront':
          index = front
          break
        case 'lower':
          index = Math.max(back, index - 1)
          break
        case 'lowerToBack':
          index = back
          break
      }
      parent.moveChild(el, index)
    })
  }

  function raiseToFront(target: Element2D | Element2D[] = selection.value): void {
    target && arrange(target, 'raiseToFront')
  }

  function raise(target: Element2D | undefined = selection.value[0]): void {
    target && arrange(target, 'raise')
  }

  function lower(target: Element2D | undefined = selection.value[0]): void {
    target && arrange(target, 'lower')
  }

  function lowerToBack(target: Element2D | Element2D[] = selection.value): void {
    target && arrange(target, 'lowerToBack')
  }

  return {
    name: 'arrange',
    commands: [
      { command: 'raiseToFront', handle: raiseToFront },
      { command: 'raise', handle: raise },
      { command: 'lower', handle: lower },
      { command: 'lowerToBack', handle: lowerToBack },
    ],
    hotkeys: [
      { command: 'raiseToFront', key: 'Shift+CmdOrCtrl+ArrowUp' },
      { command: 'raise', key: 'CmdOrCtrl+ArrowUp' },
      { command: 'lower', key: 'CmdOrCtrl+ArrowDown' },
      { command: 'lowerToBack', key: 'Shift+CmdOrCtrl+ArrowDown' },
    ],
  }
})

import type { Element2D } from 'modern-canvas'
import { definePlugin } from '../editor'

declare global {
  namespace Mce {
    interface Hotkeys {
      bringToFront: [event: KeyboardEvent]
      bringForward: [event: KeyboardEvent]
      sendBackward: [event: KeyboardEvent]
      sendToBack: [event: KeyboardEvent]
    }

    interface Commands {
      bringToFront: (target?: Element2D | Element2D[]) => void
      bringForward: (target?: Element2D) => void
      sendBackward: (target?: Element2D) => void
      sendToBack: (target?: Element2D | Element2D[]) => void
    }
  }
}

export default definePlugin((editor) => {
  const {
    selection,
  } = editor

  function zOrder(
    target: Element2D | Element2D[],
    type: 'bringForward' | 'bringToFront' | 'sendBackward' | 'sendToBack',
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
        case 'bringForward':
          index = Math.min(parent.children.length - 1, index + 1)
          break
        case 'bringToFront':
          index = front
          break
        case 'sendBackward':
          index = Math.max(back, index - 1)
          break
        case 'sendToBack':
          index = back
          break
      }
      parent.moveChild(el, index)
    })
  }

  function bringToFront(target: Element2D | Element2D[] = selection.value): void {
    target && zOrder(target, 'bringToFront')
  }

  function bringForward(target: Element2D | undefined = selection.value[0]): void {
    target && zOrder(target, 'bringForward')
  }

  function sendBackward(target: Element2D | undefined = selection.value[0]): void {
    target && zOrder(target, 'sendBackward')
  }

  function sendToBack(target: Element2D | Element2D[] = selection.value): void {
    target && zOrder(target, 'sendToBack')
  }

  return {
    name: 'layerOrder',
    commands: [
      { command: 'bringToFront', handle: bringToFront },
      { command: 'bringForward', handle: bringForward },
      { command: 'sendBackward', handle: sendBackward },
      { command: 'sendToBack', handle: sendToBack },
    ],
    hotkeys: [
      { command: 'bringToFront', key: ']' },
      { command: 'bringForward', key: 'CmdOrCtrl+]' },
      { command: 'sendBackward', key: 'CmdOrCtrl+[' },
      { command: 'sendToBack', key: '[' },
    ],
  }
})

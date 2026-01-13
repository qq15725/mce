import type { Node } from 'modern-canvas'
import { definePlugin } from '../plugin'

declare global {
  namespace Mce {
    type AlignCommandDirection
      = | 'left'
        | 'horizontal-center'
        | 'right'
        | 'top'
        | 'vertical-center'
        | 'bottom'

    interface Commands {
      bringForward: (target?: Node) => void
      sendBackward: (target?: Node) => void
      bringToFront: (target?: Node | Node[]) => void
      sendToBack: (target?: Node | Node[]) => void
      align: (direction: AlignCommandDirection) => void
      alignLeft: () => void
      alignRight: () => void
      alignTop: () => void
      alignBottom: () => void
      alignHorizontalCenter: () => void
      alignVerticalCenter: () => void
    }
  }
}

export default definePlugin((editor) => {
  const {
    isElement,
    rootAabb,
    elementSelection,
    selection,
    getAabb,
  } = editor

  function align(direction: Mce.AlignCommandDirection) {
    elementSelection.value.forEach((el) => {
      if (el.parent && isElement(el.parent)) {
        const parentAabb = getAabb(el.parent)

        switch (direction) {
          case 'left':
            el.style.left = 0
            break
          case 'horizontal-center':
            el.style.left = (parentAabb.width - el.style.width) / 2
            break
          case 'right':
            el.style.left = parentAabb.width - el.style.width
            break
          case 'top':
            el.style.top = 0
            break
          case 'vertical-center':
            el.style.top = (parentAabb.height - el.style.height) / 2
            break
          case 'bottom':
            el.style.top = parentAabb.height - el.style.height
            break
        }
      }
      else {
        switch (direction) {
          case 'left':
            el.style.left = rootAabb.value.left
            break
          case 'horizontal-center':
            el.style.left = (rootAabb.value.left + rootAabb.value.width - el.style.width) / 2
            break
          case 'right':
            el.style.left = (rootAabb.value.left + rootAabb.value.width) - el.style.width
            break
          case 'top':
            el.style.top = rootAabb.value.top
            break
          case 'vertical-center':
            el.style.top = (rootAabb.value.top + rootAabb.value.height - el.style.height) / 2
            break
          case 'bottom':
            el.style.top = (rootAabb.value.top + rootAabb.value.height) - el.style.height
            break
        }
      }
    })
  }

  function zOrder(
    target: Node | Node[],
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

  function bringToFront(target: Node | Node[] = selection.value): void {
    target && zOrder(target, 'bringToFront')
  }

  function bringForward(target: Node | undefined = selection.value[0]): void {
    target && zOrder(target, 'bringForward')
  }

  function sendBackward(target: Node | undefined = selection.value[0]): void {
    target && zOrder(target, 'sendBackward')
  }

  function sendToBack(target: Node | Node[] = selection.value): void {
    target && zOrder(target, 'sendToBack')
  }

  return {
    name: 'mce:arrange',
    commands: [
      { command: 'bringForward', handle: bringForward },
      { command: 'sendBackward', handle: sendBackward },
      { command: 'bringToFront', handle: bringToFront },
      { command: 'sendToBack', handle: sendToBack },
      { command: 'align', handle: align },
      { command: 'alignLeft', handle: () => align('left') },
      { command: 'alignRight', handle: () => align('right') },
      { command: 'alignTop', handle: () => align('top') },
      { command: 'alignBottom', handle: () => align('bottom') },
      { command: 'alignHorizontalCenter', handle: () => align('horizontal-center') },
      { command: 'alignVerticalCenter', handle: () => align('vertical-center') },
    ],
    hotkeys: [
      { command: 'bringForward', key: 'CmdOrCtrl+]' },
      { command: 'sendBackward', key: 'CmdOrCtrl+[' },
      { command: 'bringToFront', key: ']' },
      { command: 'sendToBack', key: '[' },
      { command: 'alignLeft', key: 'Alt+a' },
      { command: 'alignRight', key: 'Alt+d' },
      { command: 'alignTop', key: 'Alt+w' },
      { command: 'alignBottom', key: 'Alt+s' },
      { command: 'alignHorizontalCenter', key: 'Alt+h' },
      { command: 'alignVerticalCenter', key: 'Alt+v' },
    ],
  }
})

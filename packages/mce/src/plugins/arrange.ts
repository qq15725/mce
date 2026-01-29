import type { Element2D, Node } from 'modern-canvas'
import { Aabb2D } from 'modern-canvas'
import { definePlugin } from '../plugin'

declare global {
  namespace Mce {
    type ZOrderType
      = | 'bringForward'
        | 'sendBackward'
        | 'bringToFront'
        | 'sendToBack'

    type AlignDirection
      = | 'left'
        | 'horizontal-center'
        | 'right'
        | 'top'
        | 'vertical-center'
        | 'bottom'

    type DistributeSpacingDirection
      = | 'horizontal'
        | 'vertical'

    interface Commands {
      zOrder: (type: ZOrderType, target?: Node | Node[]) => void
      bringForward: (target?: Node) => void
      sendBackward: (target?: Node) => void
      bringToFront: (target?: Node | Node[]) => void
      sendToBack: (target?: Node | Node[]) => void
      align: (direction: AlignDirection) => void
      alignLeft: () => void
      alignRight: () => void
      alignTop: () => void
      alignBottom: () => void
      alignHorizontalCenter: () => void
      alignVerticalCenter: () => void
      distributeSpacing: (direction: DistributeSpacingDirection) => void
      distributeHorizontalSpacing: () => void
      distributeVerticalSpacing: () => void
      tidyUp: () => void
    }

    interface Hotkeys {
      bringForward: [event: KeyboardEvent]
      sendBackward: [event: KeyboardEvent]
      bringToFront: [event: KeyboardEvent]
      sendToBack: [event: KeyboardEvent]
      alignLeft: [event: KeyboardEvent]
      alignRight: [event: KeyboardEvent]
      alignTop: [event: KeyboardEvent]
      alignBottom: [event: KeyboardEvent]
      alignHorizontalCenter: [event: KeyboardEvent]
      alignVerticalCenter: [event: KeyboardEvent]
      distributeHorizontalSpacing: [event: KeyboardEvent]
      distributeVerticalSpacing: [event: KeyboardEvent]
      tidyUp: [event: KeyboardEvent]
    }
  }
}

export default definePlugin((editor) => {
  const {
    isElement,
    elementSelection,
    selection,
    getAabb,
  } = editor

  function zOrder(
    type: Mce.ZOrderType,
    target: Node | Node[] = selection.value,
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

  // TODO 不支持非中心 pivot
  function align(direction: Mce.AlignDirection) {
    const len = elementSelection.value.length

    if (!len) {
      return
    }

    let targetAabb: Aabb2D | undefined
    if (len === 1) {
      const parent = elementSelection.value[0]?.parent
      if (parent && isElement(parent)) {
        targetAabb = parent.globalAabb
      }
    }
    else {
      targetAabb = getAabb(elementSelection.value)
    }

    if (!targetAabb) {
      return
    }

    elementSelection.value.forEach((el) => {
      const parentAabb = el.getParent<Element2D>()?.getGlobalAabb?.() ?? new Aabb2D()
      const hw = el.size.x / 2
      const hh = el.size.y / 2
      const cos = Math.cos(el.rotation)
      const sin = Math.sin(el.rotation)
      const dx = Math.abs(hw * cos) + Math.abs(hh * sin)
      const dy = Math.abs(hw * sin) + Math.abs(hh * cos)

      switch (direction) {
        case 'left':
          el.style.left = targetAabb.left - parentAabb.left + dx - hw
          break
        case 'horizontal-center':
          el.style.left = targetAabb.left - parentAabb.left + targetAabb.width / 2 - hw
          break
        case 'right':
          el.style.left = targetAabb.left - parentAabb.left + targetAabb.width - dx - hw
          break
        case 'top':
          el.style.top = targetAabb.top - parentAabb.top + dy - hh
          break
        case 'vertical-center':
          el.style.top = targetAabb.top - parentAabb.top + targetAabb.height / 2 - hh
          break
        case 'bottom':
          el.style.top = targetAabb.top - parentAabb.top + targetAabb.height - dy - hh
          break
      }
    })
  }

  function distributeSpacing(direction: Mce.DistributeSpacingDirection): void {
    const els = elementSelection.value

    if (els.length < 2) {
      return
    }

    const items = els.map((el) => {
      return {
        el,
        aabb: el.globalAabb,
      }
    })
    const count = items.length

    switch (direction) {
      case 'vertical': {
        const sorted = [...items].sort((a, b) => a.aabb.y - b.aabb.y)
        const start = sorted[0]
        const end = sorted[count - 1]
        const startEdge = start.aabb.y
        const endEdge = end.aabb.y + end.aabb.height
        const totalSize = sorted.reduce((sum, node) => sum + node.aabb.height, 0)
        const totalSpacing = (endEdge - startEdge) - totalSize
        const gapSize = totalSpacing / (count - 1)
        let current = start.aabb.y + start.aabb.height
        for (let i = 1; i < count - 1; i++) {
          const item = sorted[i]
          current += gapSize
          let top = current
          const parentAabb = item.el.getParent<Element2D>()?.getGlobalAabb?.()
          if (parentAabb) {
            top = top - parentAabb.top
          }
          item.el.style.top = top
          current += item.aabb.height
        }
        break
      }
      case 'horizontal': {
        const sorted = [...items].sort((a, b) => a.aabb.x - b.aabb.x)
        const start = sorted[0]
        const end = sorted[count - 1]
        const startEdge = start.aabb.x
        const endEdge = end.aabb.x + end.aabb.width
        const totalSize = sorted.reduce((sum, node) => sum + node.aabb.width, 0)
        const totalSpacing = (endEdge - startEdge) - totalSize
        const gapSize = totalSpacing / (count - 1)
        let current = start.aabb.x + start.aabb.width
        for (let i = 1; i < count - 1; i++) {
          const item = sorted[i]
          current += gapSize
          let left = current
          const parentAabb = item.el.getParent<Element2D>()?.getGlobalAabb?.()
          if (parentAabb) {
            left = left - parentAabb.left
          }
          item.el.style.left = left
          current += item.aabb.width
        }
        break
      }
    }
  }

  function tidyUp() {
    // TODO
    distributeSpacing('vertical')
  }

  return {
    name: 'mce:arrange',
    commands: [
      { command: 'zOrder', handle: zOrder },
      { command: 'bringForward', handle: () => zOrder('bringForward') },
      { command: 'sendBackward', handle: () => zOrder('sendBackward') },
      { command: 'bringToFront', handle: () => zOrder('bringToFront') },
      { command: 'sendToBack', handle: () => zOrder('sendToBack') },
      { command: 'align', handle: align },
      { command: 'alignLeft', handle: () => align('left') },
      { command: 'alignRight', handle: () => align('right') },
      { command: 'alignTop', handle: () => align('top') },
      { command: 'alignBottom', handle: () => align('bottom') },
      { command: 'alignHorizontalCenter', handle: () => align('horizontal-center') },
      { command: 'alignVerticalCenter', handle: () => align('vertical-center') },
      { command: 'distributeSpacing', handle: distributeSpacing },
      { command: 'distributeHorizontalSpacing', handle: () => distributeSpacing('horizontal') },
      { command: 'distributeVerticalSpacing', handle: () => distributeSpacing('vertical') },
      { command: 'tidyUp', handle: tidyUp },
    ],
    hotkeys: [
      { command: 'bringForward', key: 'CmdOrCtrl+]' },
      { command: 'sendBackward', key: 'CmdOrCtrl+[' },
      { command: 'bringToFront', key: ']' },
      { command: 'sendToBack', key: '[' },
      { command: 'alignLeft', key: 'Alt+A' },
      { command: 'alignRight', key: 'Alt+D' },
      { command: 'alignTop', key: 'Alt+W' },
      { command: 'alignBottom', key: 'Alt+S' },
      { command: 'alignHorizontalCenter', key: 'Alt+H' },
      { command: 'alignVerticalCenter', key: 'Alt+V' },
      { command: 'distributeHorizontalSpacing', key: 'Ctrl+Alt+H' },
      { command: 'distributeVerticalSpacing', key: 'Ctrl+Alt+V' },
      { command: 'tidyUp', key: 'Ctrl+Alt+T' },
    ],
  }
})

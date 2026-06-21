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
      const parentAabb = el.getParent<Element2D>()?.globalAabb ?? new Aabb2D()
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

    const count = els.length

    let lt: 'left' | 'top'
    let wh: 'width' | 'height'
    switch (direction) {
      case 'horizontal':
        lt = 'left'
        wh = 'width'
        break
      case 'vertical':
        lt = 'top'
        wh = 'height'
        break
    }

    const sorted = [...els].sort((a, b) => a.globalAabb[lt] - b.globalAabb[lt])
    const startEl = sorted[0]
    const endEl = sorted[count - 1]
    const start = startEl.globalAabb[lt]
    const end = endEl.globalAabb[lt] + endEl.globalAabb[wh]
    const totalSize = sorted.reduce((sum, node) => sum + node.globalAabb[wh], 0)
    const totalSpacing = (end - start) - totalSize
    const spacing = totalSpacing / (count - 1)
    let current = startEl.globalAabb[lt] + startEl.globalAabb[wh]
    for (let i = 1; i < count - 1; i++) {
      const el = sorted[i]
      current += spacing
      const center = current + el.globalAabb[wh] / 2
      let value = center - el.style[wh] / 2
      const parentAabb = el.getParent<Element2D>()?.globalAabb
      if (parentAabb) {
        value = value - parentAabb[lt]
      }
      el.style[lt] = value
      current += el.globalAabb[wh]
    }
  }

  // 参考「Tidy up」：将选中元素聚类成行/列，重排为间距统一的网格
  // （单行退化为水平等距、单列退化为垂直等距）。
  function tidyUp() {
    const els = elementSelection.value

    if (els.length < 2) {
      return
    }

    const DEFAULT_GAP = 20

    const items = els.map((el) => {
      const a = el.globalAabb
      return {
        el,
        left: a.left,
        top: a.top,
        width: a.width,
        height: a.height,
        cx: a.left + a.width / 2,
        cy: a.top + a.height / 2,
      }
    })

    // 按垂直中心聚类成行：中心差值落在行内最高元素半高内即视为同一行。
    const rows: (typeof items)[] = []
    const byY = [...items].sort((a, b) => a.cy - b.cy)
    let row = [byY[0]]
    let rowSum = byY[0].cy
    let rowMaxH = byY[0].height
    for (let i = 1; i < byY.length; i++) {
      const it = byY[i]
      const mean = rowSum / row.length
      const threshold = Math.max(rowMaxH, it.height) / 2
      if (Math.abs(it.cy - mean) <= threshold) {
        row.push(it)
        rowSum += it.cy
        rowMaxH = Math.max(rowMaxH, it.height)
      }
      else {
        rows.push(row)
        row = [it]
        rowSum = it.cy
        rowMaxH = it.height
      }
    }
    rows.push(row)

    // 行内按水平中心排序。
    rows.forEach(r => r.sort((a, b) => a.cx - b.cx))

    const colCount = Math.max(...rows.map(r => r.length))

    // 每列宽 = 该列各行元素的最大宽；每行高 = 行内元素的最大高。
    const colWidth = Array.from({ length: colCount }, () => 0)
    rows.forEach(r => r.forEach((it, c) => {
      colWidth[c] = Math.max(colWidth[c], it.width)
    }))
    const rowHeight = rows.map(r => Math.max(...r.map(it => it.height)))

    // 统一间距取自当前布局中最小的正间距，无可用值时回退 DEFAULT_GAP。
    const hGaps: number[] = []
    rows.forEach((r) => {
      for (let i = 1; i < r.length; i++) {
        const g = r[i].left - (r[i - 1].left + r[i - 1].width)
        if (g >= 0) {
          hGaps.push(g)
        }
      }
    })
    const vGaps: number[] = []
    for (let i = 1; i < rows.length; i++) {
      const prevBottom = Math.max(...rows[i - 1].map(it => it.top + it.height))
      const curTop = Math.min(...rows[i].map(it => it.top))
      const g = curTop - prevBottom
      if (g >= 0) {
        vGaps.push(g)
      }
    }
    const hGap = hGaps.length ? Math.min(...hGaps) : DEFAULT_GAP
    const vGap = vGaps.length ? Math.min(...vGaps) : DEFAULT_GAP

    // 锚定整体包围盒左上角，避免重排后整体漂移。
    const originX = Math.min(...items.map(it => it.left))
    const originY = Math.min(...items.map(it => it.top))

    const colX: number[] = []
    let x = originX
    for (let c = 0; c < colCount; c++) {
      colX[c] = x
      x += colWidth[c] + hGap
    }
    const rowY: number[] = []
    let y = originY
    for (let r = 0; r < rows.length; r++) {
      rowY[r] = y
      y += rowHeight[r] + vGap
    }

    // 写回（沿用 distributeSpacing 的中心换算约定，逐元素按各自父级换算回本地坐标）。
    rows.forEach((r, ri) => {
      r.forEach((it, ci) => {
        const centerX = colX[ci] + it.width / 2
        const centerY = rowY[ri] + it.height / 2
        const parentAabb = it.el.getParent<Element2D>()?.globalAabb
        it.el.style.left = centerX - it.el.style.width / 2 - (parentAabb?.left ?? 0)
        it.el.style.top = centerY - it.el.style.height / 2 - (parentAabb?.top ?? 0)
      })
    })
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

import type { Element2D, Node } from 'modern-canvas'
import type { Vector2Like } from 'modern-path2d'
import { definePlugin } from '../plugin'

// 画板内滚动：内容溢出可滚动画板(overflow:auto/scroll)时，鼠标悬在画板上滚轮
// → 滚动画板内部内容，而不是平移整个视口。滚动量写入引擎运行时的
// `frame.contentOffset`（只作用于子节点、画板自身 box/裁剪框不动，不进文档）。
// 滚动条的渲染与拖拽由引擎（Element2D）负责，这里只做滚轮路由。

export function clampScroll(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v))
}

// overflow:auto/scroll 的画板才可滚（hidden 只裁剪不滚）。
function isScrollable(el: any): boolean {
  const o = el?.style?.overflow
  return o === 'auto' || o === 'scroll'
}

// 世界坐标点是否落在画板的世界 AABB 内（contentOffset 不影响画板自身 globalAabb）。
function frameContainsPoint(frame: Element2D, p: Vector2Like): boolean {
  const a = (frame as any).globalAabb
  if (!a) {
    return false
  }
  return p.x >= a.min.x
    && p.x <= a.min.x + a.size.x
    && p.y >= a.min.y
    && p.y <= a.min.y + a.size.y
}

// 指针(世界坐标)下最内层的「可滚动画板」（支持嵌套，深者优先）。
export function scrollableFrameUnderPoint(
  roots: Node[] | undefined,
  isFrameNode: (n: Node) => boolean,
  p: Vector2Like,
): Element2D | undefined {
  let found: Element2D | undefined
  const visit = (nodes: Node[] | undefined): void => {
    for (const n of nodes ?? []) {
      if (isFrameNode(n) && frameContainsPoint(n as Element2D, p)) {
        if (isScrollable(n)) {
          found = n as Element2D
        }
        visit((n as Element2D).children)
      }
    }
  }
  visit(roots)
  return found
}

export default definePlugin((editor) => {
  const {
    drawboardDom,
    camera,
    isFrameNode,
    root,
  } = editor

  // 滚动后子节点 globalTransform 下一帧才更新，故延到下一帧再补发一次 pointermove，
  // 让 hover / 引擎滚动条悬停态按更新后的位置在当前光标处重新命中（多次滚动合并一次）。
  let rehoverRaf = 0
  function scheduleRehover(clientX: number, clientY: number): void {
    if (rehoverRaf) {
      return
    }
    rehoverRaf = requestAnimationFrame(() => {
      rehoverRaf = 0
      drawboardDom.value?.dispatchEvent(new PointerEvent('pointermove', {
        clientX,
        clientY,
        bubbles: true,
      }))
    })
  }

  // wheel 事件的 clientX/Y → 世界坐标（比 getGlobalPointer 的 tracked 值更贴合本次事件）。
  function clientToGlobal(clientX: number, clientY: number): Vector2Like {
    const rect = drawboardDom.value?.getBoundingClientRect()
    return camera.value.toGlobal(
      { x: clientX - (rect?.left ?? 0), y: clientY - (rect?.top ?? 0) },
      { x: 0, y: 0 },
    )
  }

  // 滚轮是否落在可自身滚动、且尚未滚到该方向尽头的浮层（如评论列表）内。
  // 这类浮层作为 overlay 挂在 drawboard 内，dom.contains 为 true，若不排除会被画板滚动吞掉原生滚动。
  function overNativeScrollable(target: EventTarget | null, boundary: Element, dx: number, dy: number): boolean {
    let el = target instanceof Element ? target : null
    while (el && el !== boundary) {
      if (el instanceof HTMLElement) {
        const style = getComputedStyle(el)
        if (dy && /auto|scroll/.test(style.overflowY) && el.scrollHeight > el.clientHeight) {
          return true
        }
        if (dx && /auto|scroll/.test(style.overflowX) && el.scrollWidth > el.clientWidth) {
          return true
        }
      }
      el = el.parentElement
    }
    return false
  }

  function onWheel(e: WheelEvent): void {
    // ⌘/Ctrl+滚轮是缩放，交给引擎相机。
    if (e.ctrlKey || e.metaKey) {
      return
    }
    const dom = drawboardDom.value
    if (!dom || !dom.contains(e.target as any)) {
      return
    }
    // 滚轮落在可原生滚动的浮层（评论列表等）上：交给浏览器原生滚动，不驱动画板。
    if (overNativeScrollable(e.target, dom, e.deltaX, e.deltaY)) {
      return
    }
    const gp = clientToGlobal(e.clientX, e.clientY)
    const frame = scrollableFrameUnderPoint(root.value?.children, isFrameNode, gp)
    if (!frame) {
      return
    }
    // 滚动区间由引擎计算（与滚动条同一份逻辑）。
    const range = frame.getScrollRange?.()
    if (!range) {
      return
    }
    const overflowX = range.x.max > range.x.min
    const overflowY = range.y.max > range.y.min
    if (!overflowX && !overflowY) {
      return
    }
    const { zoom } = camera.value
    let dx = e.deltaX
    let dy = e.deltaY
    // shift+竖向滚轮 → 横向滚动（无横向 delta 的鼠标）。
    if (e.shiftKey && !dx) {
      dx = dy
      dy = 0
    }
    const co = frame.contentOffset
    let handled = false
    if (overflowY && dy) {
      co.y = clampScroll(co.y + dy / zoom.y, range.y.min, range.y.max)
      handled = true
    }
    if (overflowX && dx) {
      co.x = clampScroll(co.x + dx / zoom.x, range.x.min, range.x.max)
      handled = true
    }
    // 吞掉事件：capture 阶段 stopPropagation 阻止事件抵达 drawboard 上的引擎监听 → 视口不平移。
    if (handled) {
      e.preventDefault()
      e.stopPropagation()
      scheduleRehover(e.clientX, e.clientY)
    }
  }

  return {
    name: 'mce:frameScroll',
    setup() {
      window.addEventListener('wheel', onWheel, { capture: true, passive: false })
    },
  }
})

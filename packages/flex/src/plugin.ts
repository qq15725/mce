import type { Element2D } from 'modern-canvas'
import type { FlexDirection } from 'modern-idoc'
import { definePlugin, isFlexContainer } from 'mce'
import { Flexbox } from 'modern-canvas'

import { h, ref } from 'vue'
import FlexDropIndicator from './FlexDropIndicator.vue'

declare global {
  namespace Mce {
    /** Container-level flex/auto-layout properties exposed to UI panels. */
    type FlexStyleKey
      = | 'flexDirection'
        | 'flexWrap'
        | 'justifyContent'
        | 'alignItems'
        | 'alignContent'
        | 'gap'
        | 'padding'
        | 'paddingTop'
        | 'paddingLeft'
        | 'paddingRight'
        | 'paddingBottom'

    interface Commands {
      enableFlexLayout: (direction?: FlexDirection) => void
      disableFlexLayout: () => void
      toggleFlexLayout: () => void
      isFlexLayout: () => boolean
      setFlexStyle: (key: FlexStyleKey, value: any) => void
      getFlexStyle: (key: FlexStyleKey) => any
    }
  }
}

/**
 * Drag-to-reorder for children of a flex/auto-layout container.
 *
 * `transform.ts` skips the absolute move for such a child; here we make it
 * follow the cursor (a temporary left/top offset over its flow slot), swap
 * order with its siblings as its centre crosses theirs, and on release drop
 * the offset so it snaps back into its (new) slot.
 *
 * The sibling layout is derived analytically from sizes/gap captured once at
 * drag start + the current children order (the order array updates
 * synchronously on `moveChild`, but the rendered transforms only catch up on
 * the next tick — so reading them back with `getObb` mid-drag is stale and
 * makes the swap oscillate at the boundary). Structural moves use the reactive
 * nodes directly — modern-canvas markRaw's the yoga node so there's no embind
 * Proxy crash, and the Vue tree (layers panel) stays in sync (toRaw would
 * desync the panel from the canvas).
 */
const flexLayout = definePlugin((editor) => {
  const {
    isElement,
    elementSelection,
    getObb,
    getGlobalPointer,
    root,
  } = editor

  interface Drag {
    el: Element2D
    parent: Element2D
    horizontal: boolean
    reverse: boolean
    gap: number
    contentStart: number
    crossSlot: number
    /** main-axis size by instanceId (captured once; sizes don't change) */
    size: Map<number, number>
  }
  let drag: Drag | undefined

  let spaceHeld = false
  // 插入指示线的槽位(世界坐标),拖拽中由 innerMove 填充、进出/结束清空。
  const dropSlot = ref<{ horizontal: boolean, main: number, crossStart: number, crossEnd: number } | undefined>()

  function flexParentOf(el: Element2D | undefined): Element2D | undefined {
    const parent = el?.getParent<Element2D>()
    return parent && isElement(parent) && isFlexContainer(parent)
      ? parent
      : undefined
  }

  function elementChildren(parent: Element2D): Element2D[] {
    return parent.children.filter(c => isElement(c)) as Element2D[]
  }

  /**
   * The INNERMOST flex container whose world AABB contains the pointer. Auto-layout
   * can be any element (not just a top-level frame), so we walk the whole tree.
   * Innermost + pointer-based (Figma-style): hovering a nested auto-layout joins
   * the nested one; hovering an outer frame's gap joins the outer. Excludes the
   * dragged element itself and anything nested inside it.
   */
  function flexFrameAt(el: Element2D, pointer: { x: number, y: number }): Element2D | undefined {
    let hit: Element2D | undefined
    const visit = (node: Element2D): void => {
      for (const child of node.children) {
        if (!isElement(child))
          continue
        const c = child as Element2D
        if (c.equal(el) || c.findAncestor(n => n.equal(el)))
          continue
        if (isFlexContainer(c)) {
          const aabb = c.globalAabb
          if (aabb.contains(pointer) && (!hit || aabb.getArea() < hit.globalAabb.getArea()))
            hit = c
        }
        visit(c)
      }
    }
    visit(root.value as any)
    return hit
  }

  /** el's slot main-start and the siblings' main-axis centres, for one order. */
  function layout(d: Drag, order: Element2D[]): { elStart: number, centers: number[] } {
    let pos = d.contentStart
    let elStart = pos
    const centers: number[] = []
    for (const c of order) {
      const s = d.size.get(c.instanceId) ?? 0
      if (c.equal(d.el))
        elStart = pos
      else
        centers.push(pos + s / 2)
      pos += s + d.gap
    }
    return { elStart, centers }
  }

  /** Insert index for a main-axis centre among `order` (reverse-aware). */
  function insertIndex(d: Drag, dragMain: number, order: Element2D[]): number {
    const { centers } = layout(d, order)
    const before = centers.filter(c => c < dragMain).length
    return d.reverse ? centers.length - before : before
  }

  /** Snapshot a flex container's layout params (sizes/gap/dir/content-start). */
  function snapshot(parent: Element2D, el: Element2D): Drag {
    const s = parent.style as any
    const dir = s.flexDirection ?? 'row'
    const horizontal = dir === 'row' || dir === 'row-reverse'
    const children = elementChildren(parent)
    const mainSize = (o: any) => (horizontal ? o.width : o.height)
    const size = new Map<number, number>()
    children.forEach(c => size.set(c.instanceId, mainSize(getObb(c))))
    // contentStart / crossSlot / gap come from the container geometry + style,
    // NOT from a child's getObb position: right after moveChild the layout has
    // not reflowed yet (getObb is the stale pre-move position), which made
    // elStart wrong so the element didn't follow the cursor on re-entering flex.
    const num = (v: any): number => (typeof v === 'number' ? v : (Number.parseFloat(v) || 0))
    const fa = parent.globalAabb
    const padMain = horizontal ? num(s.paddingLeft ?? s.padding) : num(s.paddingTop ?? s.padding)
    const padCross = horizontal ? num(s.paddingTop ?? s.padding) : num(s.paddingLeft ?? s.padding)
    return {
      el,
      parent,
      horizontal,
      reverse: typeof dir === 'string' && dir.endsWith('-reverse'),
      gap: num(s.gap),
      contentStart: (horizontal ? fa.x : fa.y) + padMain,
      crossSlot: (horizontal ? fa.y : fa.x) + padCross,
      size,
    }
  }

  function onKey(e: KeyboardEvent): void {
    if (e.code === 'Space')
      spaceHeld = e.type === 'keydown'
  }

  /** Reorder within the current flex parent + follow the cursor. */
  function innerMove(value: Mce.TransformValue): void {
    if (!drag)
      return
    const d = drag
    const dragMain = d.horizontal ? value.left + value.width / 2 : value.top + value.height / 2

    // Reorder decision from the analytic layout (stable: reading siblings' getObb
    // right after moveChild is stale and oscillates at the boundary).
    const order = elementChildren(d.parent)
    const index = insertIndex(d, dragMain, order)
    if (index !== order.findIndex(c => c.equal(d.el))) {
      d.parent.moveChild(d.el, index)
    }

    // Cursor offset from the element's REAL flow slot: clear the offset, reflow
    // the container, then read the element's true getObb position. The analytic
    // slot (size accumulation) drifts when siblings are flex containers / hug /
    // shrink; the real yoga result doesn't. reflow makes getObb non-stale here.
    d.el.style.left = 0
    d.el.style.top = 0
    d.parent.updateGlobalTransform()
    const slot = getObb(d.el)
    d.el.style.left = value.left - slot.left
    d.el.style.top = value.top - slot.top

    // Insertion indicator at the element's slot main-start, across the container.
    const fa = d.parent.globalAabb
    const main = d.horizontal ? slot.left : slot.top
    dropSlot.value = d.horizontal
      ? { horizontal: true, main, crossStart: fa.y, crossEnd: fa.y + fa.height }
      : { horizontal: false, main, crossStart: fa.x, crossEnd: fa.x + fa.width }
  }

  /**
   * Per-frame flex drag state machine: enter a flex frame (insert at the
   * main-axis index), leave one (detach to root, restore absolute pos so it
   * keeps following the cursor; autoNest then nests into any plain frame
   * underneath), or reorder within the current one. Space temporarily
   * suppresses joining. Structural moves use reactive nodes (engine markRaw's
   * the yoga node → no embind crash, and the layers panel stays in sync).
   */
  function move(value: Mce.TransformValue): void {
    const el = elementSelection.value[0]
    if (elementSelection.value.length !== 1 || !el)
      return
    dropSlot.value = undefined
    // Pointer-based hit-test (Figma-style): the cursor — not the (possibly large)
    // dragged box — decides which flex frame, so hovering a nested auto-layout
    // enters the nested one while hovering an outer frame's gap enters the outer.
    const pointer = getGlobalPointer()
    const targetFlex = spaceHeld ? undefined : flexFrameAt(el, pointer)
    const currentFlex = flexParentOf(el)

    // Reorder within the current flex frame (cursor over it, not a deeper child).
    if (targetFlex && targetFlex.equal(currentFlex)) {
      if (!drag || !drag.parent.equal(targetFlex))
        drag = snapshot(targetFlex, el)
      innerMove(value)
      return
    }

    // Enter another flex frame — a nested child, a sibling, or a fresh one — at
    // the main-axis index (index from the element box, level from the cursor).
    if (targetFlex) {
      const d0 = snapshot(targetFlex, el)
      const dragMain = d0.horizontal ? value.left + value.width / 2 : value.top + value.height / 2
      const idx = insertIndex(d0, dragMain, elementChildren(targetFlex))
      // Clear any stale offset before joining (else the leftover left/top stacks
      // onto the new slot), then force one reflow so the element's flex slot takes
      // effect immediately. Otherwise layout is deferred to next tick — the element
      // still renders at its pre-join position while innerMove's offset is computed
      // from the (analytic) new slot, so it doesn't follow the cursor.
      el.style.left = 0
      el.style.top = 0
      targetFlex.moveChild(el, idx)
      // Reflow the CONTAINER (not just el): the siblings must re-flow to open the
      // element's slot, otherwise they stay put and the element renders on top of
      // them at a stale position while its offset targets the analytic slot.
      targetFlex.updateGlobalTransform()
      drag = snapshot(targetFlex, el)
      innerMove(value)
      return
    }

    // Leave flex frame → detach to root + restore absolute (cursor) position.
    if (currentFlex) {
      // Freeze the flex-resolved size first: a flex child may be auto-sized
      // (width/height 'auto'); once absolutely positioned the engine relayout
      // rejects 'auto' (setWidth "auto0"), and per Figma an item dragged out of
      // auto-layout keeps its rendered size.
      const o = getObb(el)
      // 先快照成数值：设 s.width 可能触发重算并原地改写 o，再读 o.height 会拿到脏值。
      const ow = o.width
      const oh = o.height
      const s = el.style as any
      if (typeof s.width !== 'number')
        s.width = ow
      if (typeof s.height !== 'number')
        s.height = oh
      root.value.moveChild(el, root.value.children.length)
      el.style.left = value.left
      el.style.top = value.top
      el.updateGlobalTransform()
      drag = undefined
    }
  }

  function start(): void {
    drag = undefined
    spaceHeld = false
    window.addEventListener('keydown', onKey)
    window.addEventListener('keyup', onKey)
    // Pre-snapshot when the drag starts already inside a flex frame (first
    // frame's reorder needs it); the move() state machine handles the rest.
    const el = elementSelection.value[0]
    if (elementSelection.value.length === 1 && el) {
      const parent = flexParentOf(el)
      if (parent)
        drag = snapshot(parent, el)
    }
  }

  function end(): void {
    window.removeEventListener('keydown', onKey)
    window.removeEventListener('keyup', onKey)
    // Only clear the reorder offset when the element is still in the flex parent
    // it was reordering within. If it was detached mid-drag (dragged out / moved
    // to root by autoNest), its left/top is now an absolute position — zeroing it
    // would snap the element to (0,0).
    if (drag && drag.el.getParent<Element2D>()?.equal(drag.parent)) {
      // Drop the temporary offset → snaps back to the (reordered) flow slot.
      drag.el.style.left = 0
      drag.el.style.top = 0
    }
    drag = undefined
    spaceHeld = false
    dropSlot.value = undefined
  }

  // ── Container-level flex commands (UI builds panels on top of these,
  // mirroring the setTextStyle/getTextStyle pattern in typography.ts). ──

  /** The selected element, treated as a flex container. */
  function container(): Element2D | undefined {
    const el = elementSelection.value[0]
    return el && isElement(el) ? el : undefined
  }

  function isFlexLayout(): boolean {
    return isFlexContainer(container())
  }

  function enableFlexLayout(direction: FlexDirection = 'row'): void {
    const el = container()
    if (!el)
      return
    const s = el.style as any
    s.display = 'flex'
    s.flexDirection = direction
    // Seed sensible defaults without clobbering values the user already set.
    s.justifyContent ??= 'flex-start'
    s.alignItems ??= 'flex-start'
    s.gap ??= 0
    el.requestDraw?.()
  }

  function disableFlexLayout(): void {
    const el = container()
    if (!el)
      return
    // 'freeform' restores absolute (left/top) positioning of children.
    const s = el.style as any
    s.display = 'freeform'
    el.requestDraw?.()
  }

  function toggleFlexLayout(): void {
    if (isFlexLayout())
      disableFlexLayout()
    else
      enableFlexLayout()
  }

  function setFlexStyle(key: Mce.FlexStyleKey, value: any): void {
    const el = container()
    if (!el)
      return
    const s = el.style as any
    s[key] = value
    el.requestDraw?.()
  }

  function getFlexStyle(key: Mce.FlexStyleKey): any {
    return (container()?.style as any)?.[key]
  }

  return {
    name: 'mce:flexLayout',
    // yoga (flex 布局引擎) 需异步加载后才能创建 Flexbox 节点；未 load 时子元素不参与 flow。
    setup: () => Flexbox.load(),
    components: [
      {
        type: 'overlay',
        component: () => h(FlexDropIndicator, { slot: dropSlot.value }),
      },
    ],
    commands: [
      { command: 'enableFlexLayout', handle: enableFlexLayout },
      { command: 'disableFlexLayout', handle: disableFlexLayout },
      { command: 'toggleFlexLayout', handle: toggleFlexLayout },
      { command: 'isFlexLayout', handle: isFlexLayout },
      { command: 'setFlexStyle', handle: setFlexStyle },
      { command: 'getFlexStyle', handle: getFlexStyle },
    ],
    events: {
      selectionTransformStarted: start,
      selectionTransformed: (ctx) => {
        if (ctx.handle === 'move')
          move(ctx.value)
      },
      selectionTransformEnded: end,
    },
  }
  // Run after transform's setTransform: on drag-OUT, transform sees the element
  // still in flex (its move is flex-suppressed → no-op), then we detach it and
  // set its absolute cursor position — so transform can't overwrite it with a
  // stale "style.left + offset" and make it jump on the first frame.
}, { enforce: 'post' })

export function plugin() {
  return flexLayout
}

import type { Element2D } from 'modern-canvas'
import type { FlexDirection } from 'modern-idoc'
import { toRaw } from 'vue'
import { definePlugin } from '../plugin'

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
 * makes the swap oscillate at the boundary). Structural changes run on the raw
 * (non-reactive) nodes, else the canvas hands a Proxy to yoga's embind which
 * throws a Proxy-invariant error and drops the child.
 */
export default definePlugin((editor) => {
  const {
    isElement,
    elementSelection,
    getObb,
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

  function flexParentOf(el: Element2D | undefined): Element2D | undefined {
    const parent = el?.getParent<Element2D>()
    return parent && isElement(parent) && (parent.style as any)?.display === 'flex'
      ? parent
      : undefined
  }

  function elementChildren(parent: Element2D): Element2D[] {
    return parent.children.filter(c => isElement(c)) as Element2D[]
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

  function start(): void {
    drag = undefined
    const el = elementSelection.value[0]
    if (elementSelection.value.length !== 1 || !el)
      return
    const parent = flexParentOf(el)
    if (!parent)
      return
    const dir = (parent.style as any).flexDirection ?? 'row'
    const horizontal = dir === 'row' || dir === 'row-reverse'
    const children = elementChildren(parent)
    const main = (o: any) => (horizontal ? o.left : o.top)
    const mainSize = (o: any) => (horizontal ? o.width : o.height)

    const size = new Map<number, number>()
    children.forEach(c => size.set(c.instanceId, mainSize(getObb(c))))
    const first = getObb(children[0])
    // Infer the gap from the first two slots (avoids parsing style units).
    const gap = children[1]
      ? main(getObb(children[1])) - (main(first) + mainSize(first))
      : 0
    const elObb = getObb(el)

    drag = {
      el,
      parent,
      horizontal,
      reverse: typeof dir === 'string' && dir.endsWith('-reverse'),
      gap,
      contentStart: main(first),
      crossSlot: horizontal ? elObb.top : elObb.left,
      size,
    }
  }

  function move(value: Mce.TransformValue): void {
    if (!drag)
      return
    const d = drag
    const dragMain = d.horizontal ? value.left + value.width / 2 : value.top + value.height / 2

    let order = elementChildren(d.parent)
    let { elStart, centers } = layout(d, order)
    const before = centers.filter(c => c < dragMain).length
    const index = d.reverse ? centers.length - before : before
    if (index !== order.findIndex(c => c.equal(d.el))) {
      toRaw(d.parent).moveChild(toRaw(d.el), index)
      order = elementChildren(d.parent)
      ;({ elStart } = layout(d, order))
    }

    // Follow the cursor: offset over the (analytically derived) flow slot.
    if (d.horizontal) {
      d.el.style.left = value.left - elStart
      d.el.style.top = value.top - d.crossSlot
    }
    else {
      d.el.style.top = value.top - elStart
      d.el.style.left = value.left - d.crossSlot
    }
  }

  function end(): void {
    if (drag) {
      // Drop the temporary offset → snaps back to the (reordered) flow slot.
      drag.el.style.left = 0
      drag.el.style.top = 0
      drag = undefined
    }
  }

  // ── Container-level flex commands (UI builds panels on top of these,
  // mirroring the setTextStyle/getTextStyle pattern in typography.ts). ──

  /** The selected element, treated as a flex container. */
  function container(): Element2D | undefined {
    const el = elementSelection.value[0]
    return el && isElement(el) ? el : undefined
  }

  function isFlexLayout(): boolean {
    return (container()?.style as any)?.display === 'flex'
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
})

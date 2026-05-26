import type { Element2D } from 'modern-canvas'
import { toRaw } from 'vue'
import { definePlugin } from '../plugin'

/**
 * Drag-to-reorder for children of a flex/auto-layout container.
 *
 * `transform.ts` skips the absolute move for such a child; here we make it
 * follow the cursor (a temporary left/top offset over its flow slot), swap
 * order with its siblings as its centre crosses theirs, and on release drop
 * the offset so it snaps back into its (new) slot.
 *
 * The slot position and sibling centres are cached and only recomputed on an
 * actual reorder — reading them every frame would force a yoga relayout per
 * pointermove and make the element jitter. Structural changes run on the raw
 * (non-reactive) nodes: a Vue-reactive node makes the canvas hand a Proxy to
 * yoga's embind, which throws a Proxy-invariant error and drops the child.
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
    index: number
    slot: { left: number, top: number }
    siblingCenters: number[]
  }
  let drag: Drag | undefined

  function flexParentOf(el: Element2D | undefined): Element2D | undefined {
    const parent = el?.getParent<Element2D>()
    return parent && isElement(parent) && (parent.style as any)?.display === 'flex'
      ? parent
      : undefined
  }

  /** Cache el's flow-slot position and the siblings' main-axis centres. */
  function recompute(d: Drag): void {
    const { el, parent, horizontal } = d
    const obb = getObb(el)
    d.slot = { left: obb.left - el.style.left, top: obb.top - el.style.top }
    const siblings = parent.children.filter(c => isElement(c) && !c.equal(el)) as Element2D[]
    d.siblingCenters = siblings.map((s) => {
      const o = getObb(s)
      return horizontal ? o.left + o.width / 2 : o.top + o.height / 2
    })
    d.index = el.getIndex()
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
    drag = {
      el,
      parent,
      horizontal: dir === 'row' || dir === 'row-reverse',
      reverse: typeof dir === 'string' && dir.endsWith('-reverse'),
      index: 0,
      slot: { left: 0, top: 0 },
      siblingCenters: [],
    }
    recompute(drag)
  }

  function move(value: Mce.TransformValue): void {
    if (!drag)
      return
    const d = drag

    // Swap order only when the drag centre crosses into a new slot.
    const dragMain = d.horizontal ? value.left + value.width / 2 : value.top + value.height / 2
    const before = d.siblingCenters.filter(c => c < dragMain).length
    const index = d.reverse ? d.siblingCenters.length - before : before
    if (index !== d.index) {
      toRaw(d.parent).moveChild(toRaw(d.el), index)
      recompute(d)
    }

    // Follow the cursor via an offset over the (cached) flow slot.
    d.el.style.left = value.left - d.slot.left
    d.el.style.top = value.top - d.slot.top
  }

  function end(): void {
    if (drag) {
      // Drop the temporary offset → snaps back to the (reordered) flow slot.
      drag.el.style.left = 0
      drag.el.style.top = 0
      drag = undefined
    }
  }

  return {
    name: 'mce:flexLayout',
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

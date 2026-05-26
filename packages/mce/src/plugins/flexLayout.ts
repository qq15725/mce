import type { Element2D } from 'modern-canvas'
import { toRaw } from 'vue'
import { definePlugin } from '../plugin'

/**
 * Drag-to-reorder for children of a flex/auto-layout container.
 *
 * `transform.ts` skips the absolute move for such a child; here we make it
 * follow the cursor (a temporary left/top offset on top of its flow slot),
 * swap order with its siblings as its centre crosses theirs, and on release
 * drop the offset so it snaps back into its (new) slot.
 *
 * Structural changes run on the raw (non-reactive) nodes — passing a
 * Vue-reactive node makes the canvas hand a Proxy to yoga's embind, which
 * throws a Proxy-invariant error and drops the child.
 */
export default definePlugin((editor) => {
  const {
    isElement,
    elementSelection,
    getObb,
  } = editor

  let drag: {
    el: Element2D
    parent: Element2D
    horizontal: boolean
    reverse: boolean
  } | undefined

  function flexParentOf(el: Element2D | undefined): Element2D | undefined {
    const parent = el?.getParent<Element2D>()
    return parent && isElement(parent) && (parent.style as any)?.display === 'flex'
      ? parent
      : undefined
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
    }
  }

  function move(value: Mce.TransformValue): void {
    if (!drag)
      return
    const { el, parent, horizontal, reverse } = drag

    // 1) Swap order: where does the drag centre fall among the siblings?
    const dragMain = horizontal ? value.left + value.width / 2 : value.top + value.height / 2
    const siblings = parent.children.filter(c => isElement(c) && !c.equal(el)) as Element2D[]
    const before = siblings.filter((s) => {
      const o = getObb(s)
      return (horizontal ? o.left + o.width / 2 : o.top + o.height / 2) < dragMain
    }).length
    // moveChild is a no-op when the index is unchanged.
    toRaw(parent).moveChild(toRaw(el), reverse ? siblings.length - before : before)

    // 2) Lift: render the element under the cursor (offset from its flow slot).
    const obb = getObb(el)
    el.style.left = value.left - (obb.left - el.style.left)
    el.style.top = value.top - (obb.top - el.style.top)
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

import type { Element2D } from 'modern-canvas'
import { h, ref, toRaw } from 'vue'
import FlexInsertLine from '../components/FlexInsertLine.vue'
import { definePlugin } from '../plugin'

interface InsertLine {
  left: number
  top: number
  width: number
  height: number
}

/**
 * Drag-to-reorder for children of a flex/auto-layout container.
 *
 * `transform.ts` skips the absolute move for such children; here we read the
 * drag target (`ctx.value`), figure out where it would slot among its siblings,
 * draw an insertion line, and on drop reorder via `moveChild`.
 */
export default definePlugin((editor) => {
  const {
    isElement,
    elementSelection,
    getObb,
  } = editor

  const insertLine = ref<InsertLine | null>(null)
  let pending: { el: Element2D, parent: Element2D, index: number } | undefined

  function flexParentOf(el: Element2D | undefined): Element2D | undefined {
    const parent = el?.getParent<Element2D>()
    return parent && isElement(parent) && (parent.style as any)?.display === 'flex'
      ? parent
      : undefined
  }

  function update(value: Mce.TransformValue): void {
    insertLine.value = null
    pending = undefined

    const el = elementSelection.value[0]
    if (elementSelection.value.length !== 1 || !el)
      return
    const parent = flexParentOf(el)
    if (!parent)
      return

    const dir = (parent.style as any).flexDirection ?? 'row'
    const horizontal = dir === 'row' || dir === 'row-reverse'
    const reverse = typeof dir === 'string' && dir.endsWith('-reverse')

    // Drag target centre (world), from the in-flight transform value.
    const dragMain = horizontal ? value.left + value.width / 2 : value.top + value.height / 2

    const siblings = parent.children.filter(c => isElement(c) && !c.equal(el)) as Element2D[]
    const boxes = siblings
      .map(s => getObb(s))
      .map(o => ({
        near: horizontal ? o.left : o.top,
        far: horizontal ? o.left + o.width : o.top + o.height,
        center: horizontal ? o.left + o.width / 2 : o.top + o.height / 2,
      }))
      .sort((a, b) => a.center - b.center)

    // Position among the ascending (visual) order; children order matches it
    // unless the flow is reversed.
    const asc = boxes.filter(b => b.center < dragMain).length
    pending = { el, parent, index: reverse ? siblings.length - asc : asc }

    // Insertion line geometry (world coords): perpendicular to the main axis.
    const po = getObb(parent)
    let boundary: number
    if (boxes.length === 0)
      boundary = horizontal ? po.left + po.width / 2 : po.top + po.height / 2
    else if (asc <= 0)
      boundary = boxes[0].near
    else if (asc >= boxes.length)
      boundary = boxes[boxes.length - 1].far
    else
      boundary = (boxes[asc - 1].far + boxes[asc].near) / 2

    const thickness = 2
    insertLine.value = horizontal
      ? { left: boundary - thickness / 2, top: po.top, width: thickness, height: po.height }
      : { left: po.left, top: boundary - thickness / 2, width: po.width, height: thickness }
  }

  return {
    name: 'mce:flexLayout',
    events: {
      selectionTransformed: (ctx) => {
        if (ctx.handle === 'move')
          update(ctx.value)
      },
      selectionTransformEnded: () => {
        if (pending) {
          // Reorder on the raw nodes: passing a Vue-reactive node makes the
          // canvas hand a Proxy to yoga's embind, which throws a Proxy-invariant
          // error and drops the child.
          toRaw(pending.parent).moveChild(toRaw(pending.el), pending.index)
          pending = undefined
        }
        insertLine.value = null
      },
    },
    components: [
      {
        type: 'overlay',
        component: () => h(FlexInsertLine, { line: insertLine.value }),
      },
    ],
  }
})

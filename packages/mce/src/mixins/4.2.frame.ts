import type { Element2D } from 'modern-canvas'
import type { ComputedRef } from 'vue'
import { computed } from 'vue'
import { defineMixin } from '../mixin'

declare global {
  namespace Mce {
    interface Options {
      /** Minimum visible spacing for relative insertions, in screen pixels. */
      minFrameScreenGap?: number
    }
    interface Editor {
      getFrameGap: (axis: 'x' | 'y') => number
      verticallyOrderedFrames: ComputedRef<Element2D[]>
      duplicateStackedFrame: (frame: Element2D) => Element2D | undefined
      moveStackedFrame: (frame: Element2D, direction: -1 | 1) => void
      findFrame: (target: 'next' | 'previous') => Element2D | undefined
    }
  }
}

export default defineMixin((editor, options) => {
  const {
    frames,
    isElement,
    isFrameNode,
    selection,
    getAncestorFrame,
  } = editor

  function findFrame(target: 'next' | 'previous'): Element2D | undefined {
    let current: Element2D | undefined
    const node = selection.value[0]
    if (node) {
      current = isElement(node) && isFrameNode(node, true)
        ? node
        : getAncestorFrame(node, true)
    }
    const last = frames.value.length - 1
    let index = frames.value.findIndex(node => node.equal(current))
    switch (target) {
      case 'next':
        index--
        if (index < 0) {
          index = last
        }
        break
      case 'previous':
        index++
        if (index > last) {
          index = 0
        }
        break
    }
    return frames.value[index]
  }

  const verticallyOrderedFrames = computed(() => [...frames.value].sort((a, b) => a.style.top - b.style.top || a.style.left - b.style.left))

  function getFrameGap(axis: 'x' | 'y') {
    const gap = editor.config.value.canvas.frame.gap
    const minimum = options.minFrameScreenGap
    return minimum ? Math.max(gap, Math.ceil(minimum / (editor.camera.value.zoom[axis] || 1))) : gap
  }

  function duplicateStackedFrame(frame: Element2D) {
    const pages = verticallyOrderedFrames.value
    const index = pages.findIndex(page => page.equal(frame))
    if (index < 0)
      return
    const following = pages.slice(index + 1)
    return editor.root.value.transact(() => {
      const copy = editor.addElement(frame.toJSON(), { parent: editor.root.value, index: frame.getIndex(), regenId: true, active: true })
      copy.style.top = frame.style.top + frame.style.height
      copy.style.left = frame.style.left
      for (const page of following)
        page.style.top += copy.style.height
      return copy
    })
  }

  function moveStackedFrame(frame: Element2D, direction: -1 | 1) {
    const pages = verticallyOrderedFrames.value
    const index = pages.findIndex(page => page.equal(frame))
    const other = pages[index + direction]
    if (index < 0 || !other)
      return
    editor.root.value.transact(() => {
      const [upper, lower] = direction < 0 ? [other, frame] : [frame, other]
      const top = upper.style.top
      const gap = lower.style.top - top - upper.style.height
      upper.style.top = top + lower.style.height + gap
      lower.style.top = top
      editor.root.value.moveChild(frame, other.getIndex())
    })
  }

  Object.assign(editor, {
    getFrameGap,
    verticallyOrderedFrames,
    duplicateStackedFrame,
    moveStackedFrame,
    findFrame,
  })
})

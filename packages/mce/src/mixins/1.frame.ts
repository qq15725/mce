import type { Element2D, Node } from 'modern-canvas'
import type { ComputedRef, Ref } from 'vue'
import { computed, ref } from 'vue'
import { defineMixin } from '../mixin'

declare global {
  namespace Mce {
    interface FrameThumb {
      instanceId: number
      width: number
      height: number
      url: string
    }

    interface Editor {
      frameThumbs: Ref<FrameThumb[]>
      frames: ComputedRef<Element2D[]>
      getAncestorFrame: (node?: Node, isTop?: boolean) => Element2D | undefined
    }
  }
}

export default defineMixin((editor) => {
  const {
    root,
    isFrameNode,
  } = editor

  const frames = computed(() => root.value.children.filter(v => isFrameNode(v)) ?? [])
  const frameThumbs = ref<Mce.FrameThumb[]>([])

  function getAncestorFrame(node?: Node, isTop?: boolean): Element2D | undefined {
    const when = isTop ? (v: Node) => isFrameNode(v, true) : isFrameNode
    return node?.findAncestor<Element2D>(node => when(node))
  }

  Object.assign(editor, {
    frames,
    frameThumbs,
    getAncestorFrame,
  })
})

import type { Element2D, Node } from 'modern-canvas'
import type { ComputedRef, Ref } from 'vue'
import type { AxisAlignedBoundingBox } from '../types'
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
      currentFrameAabb: ComputedRef<AxisAlignedBoundingBox>
      getAncestorFrame: (node?: Node) => Element2D | undefined
    }
  }
}

export default defineMixin((editor) => {
  const {
    root,
    isFrame,
  } = editor

  const frames = computed(() => root.value.children.filter(isFrame) ?? [])
  const frameThumbs = ref<Mce.FrameThumb[]>([])

  function getAncestorFrame(node?: Node): Node | undefined {
    return node?.findAncestor<Element2D>(node => isFrame(node))
  }

  Object.assign(editor, {
    frames,
    frameThumbs,
    getAncestorFrame,
  })
})

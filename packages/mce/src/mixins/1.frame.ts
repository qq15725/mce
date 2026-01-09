import type { Element2D, Node } from 'modern-canvas'
import type { ComputedRef, Ref } from 'vue'
import type { AxisAlignedBoundingBox } from '../types'
import { computed, ref, watch } from 'vue'
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
      currentFrameIndex: Ref<number>
      currentFrame: ComputedRef<Element2D | undefined>
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
  const currentFrameIndex = ref<number>(-1)
  const currentFrame = computed(() => frames.value[currentFrameIndex.value])
  const currentFrameAabb = computed(() => {
    const { left = 0, top = 0, width = 0, height = 0 } = currentFrame.value?.style ?? {}
    return { left, top, width, height }
  })
  const frameThumbs = ref<Mce.FrameThumb[]>([])

  function getAncestorFrame(node?: Node): Node | undefined {
    return node?.findAncestor<Element2D>(node => isFrame(node))
  }

  Object.assign(editor, {
    frames,
    frameThumbs,
    currentFrameIndex,
    currentFrame,
    currentFrameAabb,
    getAncestorFrame,
  })

  return () => {
    const {
      selection,
    } = editor

    watch(() => {
      return selection.value.length === 1 && selection.value[0]
    }, (node) => {
      if (node && isFrame(node)) {
        currentFrameIndex.value = frames.value.findIndex(v => v.equal(node))
      }
    })
  }
})

import type { Node } from 'modern-canvas'
import type { ComputedRef, Ref } from 'vue'
import type { AxisAlignedBoundingBox } from '../types'
import { Element2D } from 'modern-canvas'
import { computed, ref, watch } from 'vue'
import { defineMixin } from '../editor'

declare global {
  namespace Mce {
    interface FrameThumb {
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
      isFrame: (node: Node) => node is Element2D
      getAncestorFrame: (element?: Element2D) => Element2D | undefined
    }
  }
}

export default defineMixin((editor) => {
  const {
    root,
    getAncestor,
  } = editor

  const frames = computed(() => root.value?.children.filter(isFrame) ?? [])
  const currentFrameIndex = ref<number>(-1)
  const currentFrame = computed(() => frames.value[currentFrameIndex.value])
  const currentFrameAabb = computed(() => {
    const { left = 0, top = 0, width = 0, height = 0 } = currentFrame.value?.style ?? {}
    return { left, top, width, height }
  })
  const frameThumbs = ref<Mce.FrameThumb[]>([])

  function isFrame(node: Node): node is Element2D {
    return node instanceof Element2D
      && node.meta?.inEditorIs === 'Frame'
  }

  function getAncestorFrame(element?: Element2D): Element2D | undefined {
    const ancestor = getAncestor(element)
    return ancestor && isFrame(ancestor) ? ancestor : undefined
  }

  Object.assign(editor, {
    frames,
    frameThumbs,
    currentFrameIndex,
    currentFrame,
    currentFrameAabb,
    isFrame,
    getAncestorFrame,
  })

  return () => {
    const {
      selection,
    } = editor

    watch(() => {
      return selection.value.length === 1 && selection.value[0]
    }, (element) => {
      if (element && isFrame(element)) {
        currentFrameIndex.value = frames.value.findIndex(v => v.equal(element))
      }
    })
  }
})

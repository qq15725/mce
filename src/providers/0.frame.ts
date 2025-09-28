import type { Node } from 'modern-canvas'
import type { ComputedRef, Ref } from 'vue'
import type { AxisAlignedBoundingBox } from '../types'
import { Element2D } from 'modern-canvas'
import { computed, ref, watch } from 'vue'
import { defineProvider } from '../editor'

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
      activeFrameIndex: Ref<number>
      activeFrame: ComputedRef<Element2D | undefined>
      activeFrameAabb: ComputedRef<AxisAlignedBoundingBox>
      isFrame: (node: Node) => node is Element2D
      getAncestorFrame: (element?: Element2D) => Element2D | undefined
    }
  }
}

export default defineProvider((editor) => {
  const {
    provideProperties,
    root,
    getAncestor,
  } = editor

  const frames = computed(() => root.value?.children.filter(isFrame) ?? [])
  const activeFrameIndex = ref<number>(-1)
  const activeFrame = computed(() => frames.value[activeFrameIndex.value])
  const activeFrameAabb = computed(() => {
    const { left = 0, top = 0, width = 0, height = 0 } = activeFrame.value?.style ?? {}
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

  provideProperties({
    frames,
    frameThumbs,
    activeFrameIndex,
    activeFrame,
    activeFrameAabb,
    isFrame,
    getAncestorFrame,
  })

  return () => {
    const {
      activeElement,
    } = editor

    watch(activeElement, (element) => {
      if (element && isFrame(element)) {
        activeFrameIndex.value = frames.value.findIndex(v => v.equal(element))
      }
    })
  }
})

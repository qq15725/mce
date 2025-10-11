import type { ComputedRef, Ref } from 'vue'
import { Element2D } from 'modern-canvas'
import { computed, ref, watch } from 'vue'
import { definePlugin } from '../editor'

declare global {
  namespace Mce {
    interface Editor {
      activeElement: Ref<Element2D | undefined>
      activeElementMeta: ComputedRef<Record<string, any>>
      activeElementParent: ComputedRef<Element2D | undefined>
      activeElementAncestor: ComputedRef<Element2D | undefined>
      getAncestor: (element?: Element2D) => Element2D | undefined
      selectedElements: Ref<Element2D[]>
      hoverElement: Ref<Element2D | undefined>
      currentElements: ComputedRef<Element2D[]>
      textSelection: Ref<any[] | undefined>
    }
  }
}

export default definePlugin((editor) => {
  const activeElement = ref<Element2D>()
  const activeElementMeta = computed<Record<string, any>>(() => activeElement.value?.meta ?? {})
  const activeElementParent = computed(() => {
    const parent = activeElement.value?.getParent<Element2D>()
    if (parent instanceof Element2D) {
      return parent
    }
    return undefined
  })
  const activeElementAncestor = computed(() => getAncestor(activeElement.value))

  function getAncestor(element?: Element2D): Element2D | undefined {
    let ancestor: Element2D | undefined
    element?.forEachAncestor((_ancestor) => {
      if (_ancestor instanceof Element2D) {
        ancestor = _ancestor
      }
    })
    return ancestor
  }

  const selectedElements = ref<Element2D[]>([])
  const currentElements = computed(() => activeElement.value ? [activeElement.value] : selectedElements.value)
  const hoverElement = ref<Element2D>()
  const textSelection = ref<any[]>()

  Object.assign(editor, {
    activeElement,
    activeElementMeta,
    activeElementParent,
    activeElementAncestor,
    getAncestor,
    selectedElements,
    currentElements,
    hoverElement,
    textSelection,
  })

  return () => {
    const {
      state,
    } = editor

    watch(activeElement, (value) => {
      // debug
      ;(window as any).$$0 = value
    })

    watch(state, () => {
      textSelection.value = undefined
      hoverElement.value = undefined
    })
  }
})

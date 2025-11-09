import type { Node } from 'modern-canvas'
import type { Ref } from 'vue'
import { Element2D } from 'modern-canvas'
import { computed, ref, watch } from 'vue'
import { defineMixin } from '../editor'

declare global {
  namespace Mce {
    interface Editor {
      selection: Ref<Node[]>
      elementSelection: Ref<Element2D[]>
      textSelection: Ref<any[] | undefined>
      hoverElement: Ref<Element2D | undefined>
    }
  }
}

export default defineMixin((editor) => {
  const selection = ref<Element2D[]>([])
  const elementSelection = computed({
    get: () => selection.value.filter(v => v instanceof Element2D),
    set: val => selection.value = val,
  })
  const hoverElement = ref<Element2D>()
  const textSelection = ref<any[]>()

  Object.assign(editor, {
    selection,
    elementSelection,
    textSelection,
    hoverElement,
  })

  return () => {
    const {
      state,
    } = editor

    watch(selection, (value) => {
      // debug
      ;(window as any).$$0 = value[0]
    })

    watch(state, () => {
      textSelection.value = undefined
      hoverElement.value = undefined
    })
  }
})

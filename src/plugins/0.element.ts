import type { Ref } from 'vue'
import { Element2D } from 'modern-canvas'
import { ref, watch } from 'vue'
import { definePlugin } from '../editor'

declare global {
  namespace Mce {
    interface Editor {
      selection: Ref<Element2D[]>
      textSelection: Ref<any[] | undefined>
      getAncestor: (element?: Element2D) => Element2D | undefined
      hoverElement: Ref<Element2D | undefined>
    }
  }
}

export default definePlugin((editor) => {
  const selection = ref<Element2D[]>([])
  // let element
  // if (typeof id === 'string') {
  //   element = getElement(id)
  // }
  // else {
  //   element = id
  // }
  // const unequal = activeElement.value
  //   ? !activeElement.value.equal(element)
  //   : activeElement.value !== element
  // activeElement.value = element
  // if (element) {
  //   selection.value = []
  // }
  // if (unequal) {
  //   emit('setActiveElement', element)
  // }

  function getAncestor(element?: Element2D): Element2D | undefined {
    let ancestor: Element2D | undefined
    element?.forEachAncestor((_ancestor) => {
      if (_ancestor instanceof Element2D) {
        ancestor = _ancestor
      }
    })
    return ancestor
  }

  const hoverElement = ref<Element2D>()
  const textSelection = ref<any[]>()

  Object.assign(editor, {
    selection,
    textSelection,
    getAncestor,
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

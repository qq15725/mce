import type { Element2D } from 'modern-canvas'
import { h, ref } from 'vue'
import SmartSelection from '../components/SmartSelection.vue'
import { definePlugin } from '../plugin'

declare global {
  namespace Mce {
    interface Commands {
      setSmartSelectionCurrentElement: (element?: Element2D) => void
    }
  }
}

export default definePlugin((_editor) => {
  const currentElement = ref<Element2D>()

  return {
    name: 'mce:smartSelection',
    commands: [
      {
        command: 'setSmartSelectionCurrentElement',
        handle: el => currentElement.value = el,
      },
    ],
    components: [
      {
        type: 'overlay',
        component: () => h(SmartSelection, {
          'modelValue': currentElement.value,
          'onUpdate:modelValue': el => currentElement.value = el,
        }),
      },
    ],
  }
})

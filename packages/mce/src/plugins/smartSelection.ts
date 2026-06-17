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
    events: {
      // 切文档时清掉本插件持有的节点引用，避免指向已销毁的旧节点。
      docSet: () => currentElement.value = undefined,
    },
    components: [
      {
        type: 'overlay',
        component: () => h(SmartSelection, {
          'modelValue': currentElement.value,
          'onUpdate:modelValue': (el: any) => currentElement.value = el,
        }),
      },
    ],
  }
})

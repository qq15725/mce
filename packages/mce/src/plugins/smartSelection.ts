import type { Element2D } from 'modern-canvas'
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
  return {
    name: 'mce:smartSelection',
    components: [
      {
        type: 'overlay',
        component: SmartSelection,
      },
    ],
  }
})

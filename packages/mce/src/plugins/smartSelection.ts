import SmartSelection from '../components/SmartSelection.vue'
import { definePlugin } from '../plugin'

declare global {
  namespace Mce {
    interface Editor {
      //
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

import { computed } from 'vue'
import MadeWith from '../components/MadeWith.vue'
import { definePlugin } from '../plugin'

declare global {
  namespace Mce {
    interface UIConfig {
      madeWith: MadeWithConfig
    }

    interface MadeWithConfig {
      visible: boolean
    }
  }
}

export default definePlugin((editor) => {
  const {
    registerConfig,
  } = editor

  const config = registerConfig<Mce.MadeWithConfig>('ui.madeWith', {
    default: {
      visible: false,
    },
  })

  return {
    name: 'mce:madeWith',
    components: [
      {
        type: 'overlay',
        component: MadeWith,
        visible: computed({
          get: () => config.value.visible,
          set: val => config.value.visible = val,
        }),
      },
    ],
  }
})

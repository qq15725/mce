import MadeWith from '../components/MadeWith.vue'
import { definePlugin } from '../plugin'

declare global {
  namespace Mce {
    interface MadeWithConfig {
      enabled: boolean
    }

    interface UIConfig {
      madeWith: MadeWithConfig
    }
  }
}

export default definePlugin((editor) => {
  const {
    registerConfig,
  } = editor

  const config = registerConfig('ui.madeWith', {
    default: {
      enabled: false,
    },
  })

  return {
    name: 'mce:madeWith',
    components: [
      {
        type: 'overlay',
        component: MadeWith,
        ignore: () => !config.value.enabled,
      },
    ],
  }
})

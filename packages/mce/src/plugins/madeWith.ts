import MadeWith from '../components/MadeWith.vue'
import { definePlugin } from '../plugin'

declare global {
  namespace Mce {
    interface Config {
      madeWith: boolean
    }
  }
}

export default definePlugin((editor) => {
  const {
    config,
    registerConfig,
  } = editor

  registerConfig('madeWith', false)

  return {
    name: 'mce:madeWith',
    components: [
      {
        type: 'overlay',
        component: MadeWith,
        ignore: () => !config.value.madeWith,
      },
    ],
  }
})

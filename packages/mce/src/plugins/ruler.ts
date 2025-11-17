import Rulers from '../components/Rulers.vue'
import { definePlugin } from '../plugin'

declare global {
  namespace Mce {
    interface Config {
      ruler: boolean
    }
  }
}

export default definePlugin((editor) => {
  const {
    config,
    registerConfig,
  } = editor

  registerConfig('ruler', false)

  return {
    name: 'mce:ruler',
    components: [
      {
        type: 'overlay',
        component: Rulers,
        ignore: () => !config.value.ruler,
      },
    ],
  }
})

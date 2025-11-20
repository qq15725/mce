import Toolbelt from '../components/Toolbelt.vue'
import { definePlugin } from '../plugin'

declare global {
  namespace Mce {
    interface Config {
      toolbelt: boolean
    }
  }
}

export default definePlugin((editor) => {
  const {
    registerConfig,
  } = editor

  const toolbelt = registerConfig('toolbelt', false)

  return {
    name: 'mce:toolbelt',
    components: [
      {
        name: 'toolbelt',
        type: 'overlay',
        component: Toolbelt,
        ignore: () => !toolbelt.value,
      },
    ],
  }
})

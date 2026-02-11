import { computed } from 'vue'
import Toolbelt from '../components/Toolbelt.vue'
import { definePlugin } from '../plugin'

declare global {
  namespace Mce {
    interface UIConfig {
      toolbelt: ToolbeltConfig
    }

    interface ToolbeltConfig {
      visible: boolean
    }
  }
}

export default definePlugin((editor) => {
  const {
    registerConfig,
  } = editor

  const config = registerConfig<Mce.ToolbeltConfig>('ui.toolbelt', {
    default: {
      visible: false,
    },
  })

  return {
    name: 'mce:toolbelt',
    components: [
      {
        name: 'toolbelt',
        type: 'overlay',
        component: Toolbelt,
        visible: computed({
          get: () => config.value.visible,
          set: val => config.value.visible = val,
        }),
      },
    ],
  }
})

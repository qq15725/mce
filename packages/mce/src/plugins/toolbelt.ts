import Toolbelt from '../components/Toolbelt.vue'
import { definePlugin } from '../plugin'

declare global {
  namespace Mce {
    interface ToolbeltConfig {
      enabled?: boolean
    }

    interface UIConfig {
      toolbelt: ToolbeltConfig
    }
  }
}

export default definePlugin((editor) => {
  const {
    registerConfig,
  } = editor

  const config = registerConfig<Mce.ToolbeltConfig>('ui.toolbelt', {
    default: {
      enabled: false,
    },
  })

  return {
    name: 'mce:toolbelt',
    components: [
      {
        name: 'toolbelt',
        type: 'overlay',
        component: Toolbelt,
        ignore: () => !config.value.enabled,
      },
    ],
  }
})

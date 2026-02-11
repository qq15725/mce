import Statusbar from '../components/Statusbar.vue'
import { definePlugin } from '../plugin'

declare global {
  namespace Mce {
    interface StatusBarConfig {
      enabled: boolean
    }

    interface UIConfig {
      statusbar: StatusBarConfig
    }

    interface Panels {
      statusBar: []
    }
  }
}

export default definePlugin((editor) => {
  const {
    registerConfig,
  } = editor

  const config = registerConfig<Mce.StatusBarConfig>('ui.statusbar', {
    default: {
      enabled: false,
    },
  })

  return {
    name: 'mce:statusbar',
    components: [
      {
        name: 'statusbar',
        type: 'panel',
        position: 'bottom',
        size: 24,
        component: Statusbar,
        ignore: () => !config.value.enabled,
      },
    ],
  }
})

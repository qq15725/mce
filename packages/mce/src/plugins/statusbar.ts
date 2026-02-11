import { computed } from 'vue'
import Statusbar from '../components/Statusbar.vue'
import { definePlugin } from '../plugin'

declare global {
  namespace Mce {
    interface UIConfig {
      statusbar: StatusbarConfig
    }

    interface StatusbarConfig {
      visible: boolean
    }
  }
}

export default definePlugin((editor) => {
  const {
    registerConfig,
  } = editor

  const config = registerConfig<Mce.StatusbarConfig>('ui.statusbar', {
    default: {
      visible: false,
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
        visible: computed({
          get: () => config.value.visible,
          set: val => config.value.visible = val,
        }),
      },
    ],
  }
})

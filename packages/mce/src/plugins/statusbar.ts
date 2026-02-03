import Statusbar from '../components/Statusbar.vue'
import { definePlugin } from '../plugin'

declare global {
  namespace Mce {
    interface Config {
      statusbar: boolean
    }

    interface Panels {
      statusbar: []
    }
  }
}

export default definePlugin((editor) => {
  const {
    registerConfig,
  } = editor

  registerConfig('statusbar', { default: false })

  return {
    name: 'mce:statusbar',
    components: [
      {
        name: 'statusbar',
        type: 'panel',
        position: 'bottom',
        size: 24,
        component: Statusbar,
      },
    ],
  }
})

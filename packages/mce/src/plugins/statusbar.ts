import Statusbar from '../components/Statusbar.vue'
import { definePlugin } from '../plugin'

declare global {
  namespace Mce {
    interface Panels {
      statusbar: []
    }
  }
}

export default definePlugin(() => {
  return {
    name: 'mce:statusbar',
    components: [
      { name: 'statusbar', type: 'panel', position: 'bottom', size: 24, component: Statusbar },
    ],
  }
})

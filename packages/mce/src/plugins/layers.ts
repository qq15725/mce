import Layers from '../components/Layers.vue'
import { definePlugin } from '../plugin'

declare global {
  namespace Mce {
    interface Commands {
      layerScrollIntoView: () => boolean
    }
  }
}

export default definePlugin(() => {
  return {
    name: 'mce:layers',
    components: [
      {
        name: 'layers',
        type: 'panel',
        position: 'float',
        component: Layers,
      },
    ],
    hotkeys: [
      { command: 'togglePanel:layers', key: 'Alt+1' },
    ],
  }
})

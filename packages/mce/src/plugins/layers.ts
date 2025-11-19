import Layers from '../components/Layers.vue'
import { definePlugin } from '../plugin'

declare global {
  namespace Mce {
    interface Panels {
      layers: []
    }
  }
}

export default definePlugin(() => {
  return {
    name: 'mce:layers',
    components: [
      { name: 'layers', type: 'panel', position: 'float', component: Layers },
    ],
  }
})

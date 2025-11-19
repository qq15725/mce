import Timeline from '../components/timeline/Timeline.vue'
import { definePlugin } from '../plugin'

declare global {
  namespace Mce {
    interface Panels {
      timeline: []
    }
  }
}

export default definePlugin(() => {
  return {
    name: 'mce:timeline',
    components: [
      { name: 'timeline', type: 'panel', position: 'bottom', size: 160, component: Timeline },
    ],
  }
})

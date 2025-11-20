import Timeline from '../components/timeline/Timeline.vue'
import { definePlugin } from '../plugin'

declare global {
  namespace Mce {
    interface Config {
      timeline: boolean
    }

    interface Panels {
      timeline: []
    }
  }
}

export default definePlugin((editor) => {
  const {
    registerConfig,
  } = editor

  registerConfig('timeline', false)

  return {
    name: 'mce:timeline',
    components: [
      {
        name: 'timeline',
        type: 'panel',
        position: 'bottom',
        size: 160,
        component: Timeline,
      },
    ],
    hotkeys: [
      { command: 'panels:timeline', key: 'Alt+™' },
    ],
  }
})

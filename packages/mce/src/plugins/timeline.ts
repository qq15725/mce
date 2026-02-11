import Timeline from '../components/timeline/Timeline.vue'
import { definePlugin } from '../plugin'

declare global {
  namespace Mce {
    interface TimelineConfig {
      enabled: boolean
    }

    interface UIConfig {
      timeline: TimelineConfig
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

  registerConfig('ui.timeline', {
    default: {
      enabled: false,
    },
  })

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
      { command: 'panels:timeline', key: 'Alt+2' },
    ],
  }
})

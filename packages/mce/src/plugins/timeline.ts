import { computed } from 'vue'
import Timeline from '../components/timeline/Timeline.vue'
import { definePlugin } from '../plugin'

declare global {
  namespace Mce {
    interface UIConfig {
      timeline: TimelineConfig
    }

    interface TimelineConfig {
      visible: boolean
    }
  }
}

export default definePlugin((editor) => {
  const {
    registerConfig,
  } = editor

  const config = registerConfig('ui.timeline', {
    default: {
      visible: false,
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
        visible: computed({
          get: () => config.value.visible,
          set: val => config.value.visible = val,
        }),
      },
    ],
    hotkeys: [
      { command: 'togglePanel:timeline', key: 'Alt+2' },
    ],
  }
})

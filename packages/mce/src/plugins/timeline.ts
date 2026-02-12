import { computed, onBeforeMount, onScopeDispose } from 'vue'
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
    setup: () => {
      const {
        assets,
        on,
        off,
        exec,
        renderEngine,
        timeline,
        getTimeRange,
        root,
      } = editor

      async function updateEndTime() {
        await renderEngine.value.nextTick()
        timeline.value.endTime = root.value
          ? getTimeRange(root.value).endTime
          : 0

        if (!config.value.visible) {
          timeline.value.currentTime = timeline.value.endTime
        }
      }

      onBeforeMount(() => {
        on('setDoc', updateEndTime)
        assets.on('loaded', updateEndTime)
      })

      onScopeDispose(() => {
        off('setDoc', updateEndTime)
        assets.off('loaded', updateEndTime)
      })
    },
  }
})

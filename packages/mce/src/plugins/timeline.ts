import { computed, onBeforeMount, onScopeDispose, watch } from 'vue'
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
      }

      let requestId: number | undefined
      let prevTime: number | undefined

      function play() {
        if (requestId !== undefined)
          return
        if (!Number.isFinite(timeline.value.currentTime)) {
          timeline.value.currentTime = timeline.value.startTime
        }
        function loop(time?: number) {
          if (prevTime !== undefined && time !== undefined) {
            const tl = timeline.value
            if (tl.endTime > tl.startTime) {
              tl.addTime(time - prevTime)
            }
          }
          prevTime = time
          requestId = requestAnimationFrame(loop)
        }
        loop()
      }

      function stop() {
        if (requestId !== undefined) {
          cancelAnimationFrame(requestId)
          requestId = undefined
        }
        prevTime = undefined
      }

      watch(() => config.value.visible, (visible) => {
        if (visible) {
          stop()
        }
        else {
          play()
        }
      }, { immediate: true })

      onBeforeMount(() => {
        on('docSet', updateEndTime)
        assets.on('loaded', updateEndTime)
      })

      onScopeDispose(() => {
        stop()
        off('docSet', updateEndTime)
        assets.off('loaded', updateEndTime)
      })
    },
  }
})

import type { Ref } from 'vue'
import { computed, onBeforeMount, onScopeDispose, ref, watch } from 'vue'
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

    interface Editor {
      paused: Ref<boolean>
      fps: Ref<number>
    }

    interface Commands {
      play: () => void
      pause: () => void
      togglePlay: () => void
      seekStart: () => void
      seekEnd: () => void
      stepBackward: () => void
      stepForward: () => void
    }

    interface Hotkeys {
      togglePlay: [event: KeyboardEvent]
      seekStart: [event: KeyboardEvent]
      seekEnd: [event: KeyboardEvent]
      stepBackward: [event: KeyboardEvent]
      stepForward: [event: KeyboardEvent]
    }
  }
}

export default definePlugin((editor) => {
  const {
    registerConfig,
    timeline,
  } = editor

  const config = registerConfig('ui.timeline', {
    default: {
      visible: false,
    },
  })

  const paused = ref(true)
  const fps = ref(30)

  Object.assign(editor, { paused, fps })

  function play() {
    paused.value = false
  }

  function pause() {
    paused.value = true
  }

  function togglePlay() {
    paused.value = !paused.value
  }

  function seekStart() {
    const tl = timeline.value
    tl.currentTime = tl.startTime
  }

  function seekEnd() {
    const tl = timeline.value
    tl.currentTime = tl.endTime
  }

  function stepBackward() {
    const tl = timeline.value
    const ms = 1000 / fps.value
    const cur = Number.isFinite(tl.currentTime) ? tl.currentTime : tl.startTime
    tl.currentTime = Math.max(tl.startTime, cur - ms)
  }

  function stepForward() {
    const tl = timeline.value
    const ms = 1000 / fps.value
    const cur = Number.isFinite(tl.currentTime) ? tl.currentTime : tl.startTime
    tl.currentTime = Math.min(tl.endTime, cur + ms)
  }

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
    commands: [
      { command: 'play', handle: play },
      { command: 'pause', handle: pause },
      { command: 'togglePlay', handle: togglePlay },
      { command: 'seekStart', handle: seekStart },
      { command: 'seekEnd', handle: seekEnd },
      { command: 'stepBackward', handle: stepBackward },
      { command: 'stepForward', handle: stepForward },
    ],
    hotkeys: [
      { command: 'togglePanel:timeline', key: 'Alt+2' },
      { command: 'togglePlay', key: 'Space', preventDefault: true },
      { command: 'seekStart', key: 'Home', preventDefault: true },
      { command: 'seekEnd', key: 'End', preventDefault: true },
      { command: 'stepBackward', key: 'Left', preventDefault: true },
      { command: 'stepForward', key: 'Right', preventDefault: true },
    ],
    setup: () => {
      const {
        assets,
        on,
        off,
        renderEngine,
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

      function startRaf() {
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

      function stopRaf() {
        if (requestId !== undefined) {
          cancelAnimationFrame(requestId)
          requestId = undefined
        }
        prevTime = undefined
      }

      watch(() => config.value.visible, (visible) => {
        paused.value = visible
      }, { immediate: true })

      watch(paused, (p) => {
        if (p) {
          stopRaf()
        }
        else {
          startRaf()
        }
      }, { immediate: true })

      onBeforeMount(() => {
        on('docSet', updateEndTime)
        assets.on('loaded', updateEndTime)
      })

      onScopeDispose(() => {
        stopRaf()
        off('docSet', updateEndTime)
        assets.off('loaded', updateEndTime)
      })
    },
  }
})

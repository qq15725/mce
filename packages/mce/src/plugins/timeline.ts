import type { Animation } from 'modern-canvas'
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

    /** 正在轨道上编辑的关键帧（点击菱形时弹出浮层），null 表示未打开。 */
    interface KeyframeEditing {
      anim: Animation
      offset: number
      /** 锚点屏幕坐标（菱形中心顶端），供浮层定位。 */
      target: { x: number, y: number }
    }

    /** 循环模式：单次（到尾暂停）/ 循环（回到开头）/ 往返（到尾反向）。 */
    type LoopMode = 'none' | 'loop' | 'alternate'

    interface Editor {
      paused: Ref<boolean>
      fps: Ref<number>
      /** 播放倍速，1 为正常速度。 */
      playbackRate: Ref<number>
      loopMode: Ref<LoopMode>
      recomputeTimelineEndTime: () => Promise<void>
      keyframeEditing: Ref<KeyframeEditing | null>
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
  const playbackRate = ref(1)
  const loopMode = ref<Mce.LoopMode>('loop')

  const keyframeEditing = ref<Mce.KeyframeEditing | null>(null)

  // 原生 loop 处理「循环」回绕；「单次」「往返」由 RAF 循环自行控制。
  watch(loopMode, (mode) => {
    timeline.value.loop = mode === 'loop'
  }, { immediate: true })

  async function recomputeTimelineEndTime() {
    await editor.renderEngine.value.nextTick()
    timeline.value.endTime = editor.root.value
      ? editor.getTimeRange(editor.root.value).endTime
      : 0
  }

  Object.assign(editor, { paused, fps, playbackRate, loopMode, recomputeTimelineEndTime, keyframeEditing })

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
      } = editor

      const updateEndTime = recomputeTimelineEndTime

      let requestId: number | undefined
      let prevTime: number | undefined
      let direction: 1 | -1 = 1

      function startRaf() {
        if (requestId !== undefined)
          return
        const tl = timeline.value
        direction = 1
        // 从头重播：播放头无效或已到结尾时回到开头。
        if (!Number.isFinite(tl.currentTime) || tl.currentTime >= tl.endTime) {
          tl.currentTime = tl.startTime
        }
        function loop(time?: number) {
          if (prevTime !== undefined && time !== undefined) {
            const tl = timeline.value
            if (tl.endTime > tl.startTime) {
              tl.addTime((time - prevTime) * playbackRate.value * direction)
              if (loopMode.value === 'none') {
                if (tl.currentTime >= tl.endTime)
                  paused.value = true // 单次：到尾暂停
              }
              else if (loopMode.value === 'alternate') {
                if (direction > 0 && tl.currentTime >= tl.endTime)
                  direction = -1
                else if (direction < 0 && tl.currentTime <= tl.startTime)
                  direction = 1
              }
              // 'loop' 由原生 timeline.loop 回绕处理
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

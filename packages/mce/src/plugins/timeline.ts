import type { Animation, Video2D } from 'modern-canvas'
import type { Ref } from 'vue'
import { computed, onBeforeMount, onScopeDispose, ref, watch } from 'vue'
import Timeline from '../components/timeline/Timeline.vue'
import VideoPlayback from '../components/timeline/VideoPlayback.vue'
import { definePlugin } from '../plugin'
import { createVideoPlayback } from '../utils/videoPlayback'

declare global {
  namespace Mce {
    interface Options {
      /** 通过 playVideo 命令预览视频时的循环策略，默认循环。 */
      videoPlayback?: {
        loop?: boolean
        controls?: boolean
        /** 各视频独立预览，播放/暂停不改变全局时间轴；默认关闭。 */
        independent?: boolean
      }
    }
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
      isVideoPlaying: (node: Video2D) => boolean
      recomputeTimelineEndTime: () => Promise<void>
      keyframeEditing: Ref<KeyframeEditing | null>
    }

    interface Commands {
      play: () => void
      /** 按宿主策略播放视频；独立模式暂停后续播，restart 或播放结束后从头播放。 */
      playVideo: (node: Video2D, restart?: boolean) => Promise<void>
      pauseVideo: (node: Video2D) => void
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

export default definePlugin((editor, options) => {
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
  const loopMode = ref<Mce.LoopMode>(options.videoPlayback?.loop === false ? 'none' : 'loop')

  const keyframeEditing = ref<Mce.KeyframeEditing | null>(null)
  const videos = createVideoPlayback(options.videoPlayback?.loop ?? true)

  function isVideoPlaying(node: Video2D) {
    return node.standalone
      ? videos.isPlaying(node)
      : !paused.value && (node.loop || timeline.value.currentTime < node.globalStartTime + node.videoDuration)
  }

  // 播放语义集中在引擎 Timeline：loop 模式与倍速实时同步过去（播放推进由 RAF 喂 advance）。
  watch(loopMode, mode => timeline.value.loopMode = mode, { immediate: true })
  watch(playbackRate, rate => timeline.value.rate = rate, { immediate: true })

  async function recomputeTimelineEndTime() {
    await editor.renderEngine.value.nextTick()
    timeline.value.endTime = editor.root.value
      ? editor.getTimeRange(editor.root.value).endTime
      : 0
  }

  Object.assign(editor, { paused, fps, playbackRate, loopMode, recomputeTimelineEndTime, keyframeEditing, isVideoPlaying })

  function play() {
    paused.value = false
  }

  async function playVideo(node: Video2D, restart = false) {
    if (options.videoPlayback?.independent)
      return videos.play(node, restart)
    const loop = options.videoPlayback?.loop ?? true
    node.loop = loop
    await node.waitLoad()
    await recomputeTimelineEndTime()
    loopMode.value = loop ? 'loop' : 'none'
    timeline.value.currentTime = node.globalStartTime
    play()
  }

  function pause() {
    paused.value = true
  }

  function pauseVideo(node: Video2D) {
    if (options.videoPlayback?.independent)
      videos.pause(node)
    else
      pause()
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
        name: 'videoPlayback',
        type: 'overlay',
        component: VideoPlayback,
        visible: computed(() => options.videoPlayback?.controls === true),
      },
      {
        name: 'timeline',
        type: 'panel',
        position: 'bottom',
        size: 160,
        minSize: 80,
        component: Timeline,
        visible: computed({
          get: () => config.value.visible,
          set: val => config.value.visible = val,
        }),
      },
    ],
    commands: [
      { command: 'play', handle: play },
      { command: 'playVideo', handle: playVideo },
      { command: 'pauseVideo', handle: pauseVideo },
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

      // 切换文档：不继承上个文档的播放态与播放头。否则从「正在播放」的文档切到新文档
      // （可能 endTime=0）后 RAF 仍在推进，循环一个零长时间轴会让 currentTime 退化为 NaN，
      // 连累整张画布渲染空白。先停播放并把播放头归位，再按新内容重算时长。
      function onDocSet() {
        videos.reset()
        // 尊重「面板隐藏 ⇔ 自动播放」：面板开着（编辑态）载文档时暂停到起点，避免切文档时
        // RAF 在旧/零长时间轴上推进；面板隐藏（如灵感广场纯预览）则保持自动播放，否则载入
        // 带视频的文档后时间轴被永久暂停，视频卡在首帧不动。
        paused.value = config.value.visible
        timeline.value.currentTime = timeline.value.startTime
        updateEndTime()
      }

      let requestId: number | undefined
      let prevTime: number | undefined

      function startRaf() {
        if (requestId !== undefined)
          return
        const tl = timeline.value
        // 惰性重算时长：增量内容变更（本地增删动画 / 远端经 CRDT 同步到达的内容）不触发 docSet，
        // endTime 会失真——尤其协同对端收到含动画的内容后仍为旧值。时长只有「播放」时才真正用到，
        // 故在此按需重算一次，避免监听高频的 docUpdated 在每次更新上做全树扫描。
        void updateEndTime()
        // 播放语义集中在引擎 Timeline（play/advance/loop 模式/方向/自停）；mce 仅喂墙钟增量。
        tl.play({ rate: playbackRate.value, loopMode: loopMode.value })
        function loop(time?: number) {
          if (prevTime !== undefined && time !== undefined) {
            timeline.value.advance(time - prevTime)
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
        timeline.value.pause()
      }

      // 'none' 模式播放到端点：引擎 Timeline 自停并触发 'ended'，这里回写 UI 暂停态。
      const onEnded = (): void => {
        paused.value = true
      }
      timeline.value.on('ended', onEnded)

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
        on('docSet', onDocSet)
        assets.on('loaded', updateEndTime)
      })

      onScopeDispose(() => {
        videos.reset()
        stopRaf()
        timeline.value.off('ended', onEnded)
        off('docSet', onDocSet)
        assets.off('loaded', updateEndTime)
      })
    },
  }
})

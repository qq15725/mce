// @vitest-environment happy-dom
import { Timeline } from 'modern-canvas'
import { describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick, shallowRef } from 'vue'
import timelinePlugin from './timeline'

vi.mock('../components/timeline/Timeline.vue', () => ({ default: {} }))
vi.mock('../components/timeline/VideoPlayback.vue', () => ({ default: {} }))

describe('视频预览策略', () => {
  it.each([undefined, { loop: false }, { loop: true }])('遵循配置 %j，等待加载并从起点播放', async (videoPlayback) => {
    const scope = effectScope()
    const timeline = new Timeline()
    timeline.endTime = 1000
    timeline.currentTime = 1000
    const editor: any = {
      options: { videoPlayback },
      timeline: shallowRef(timeline),
      registerConfig: (_key: string, config: any) => shallowRef(config.default),
      renderEngine: shallowRef({ nextTick: async () => {} }),
      root: shallowRef({}),
      getTimeRange: () => ({ endTime: 2000 }),
    }
    const plugin: any = scope.run(() => (timelinePlugin as any)(editor, { videoPlayback }))
    let loaded = false
    const node: any = { loop: true, globalStartTime: 0, waitLoad: async () => {
      loaded = true
    } }
    try {
      await plugin.commands.find((c: any) => c.command === 'playVideo').handle(node)
      await nextTick()
      expect(loaded).toBe(true)
      expect(node.loop).toBe(videoPlayback?.loop ?? true)
      expect(timeline.loopMode).toBe(videoPlayback?.loop === false ? 'none' : 'loop')
      expect(timeline.currentTime).toBe(0)
      expect(timeline.endTime).toBe(2000)
      expect(editor.paused.value).toBe(false)
      timeline.play()
      timeline.advance(2001)
      expect(timeline.playing).toBe(videoPlayback?.loop !== false)
      // 播放结束后再次执行同一命令可从头重播。
      await plugin.commands.find((c: any) => c.command === 'playVideo').handle(node)
      expect(timeline.currentTime).toBe(0)
    }
    finally {
      scope.stop()
    }
  })
})

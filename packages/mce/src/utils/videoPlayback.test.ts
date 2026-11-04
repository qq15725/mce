import type { Video2D } from 'modern-canvas'
import { afterEach, expect, it, vi } from 'vitest'
import { createVideoPlayback } from './videoPlayback'

function fixture() {
  let now = 0
  let frame: FrameRequestCallback | undefined
  vi.spyOn(performance, 'now').mockImplementation(() => now)
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    frame = cb
    return 1
  })
  vi.stubGlobal('cancelAnimationFrame', () => {
    frame = undefined
  })
  const tick = (delta: number) => {
    now += delta
    const cb = frame
    frame = undefined
    cb?.(now)
  }
  return { tick, hasFrame: () => !!frame }
}

function video(duration = 2000) {
  const node = {
    src: 'test.mp4', currentTime: 0, videoDuration: duration, standalone: false, playing: false, loop: true,
    waitLoad: async () => {}, isInsideTree: () => true,
    setLocalTime(time: number) { this.currentTime = time },
    setStandalonePlaying(playing: boolean) {
      this.standalone = true
      this.playing = playing
    },
  }
  return node as unknown as Video2D & { playing: boolean }
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

it('两段视频独立播放、暂停续播；结束后重播不会重置另一段', async () => {
  const { tick, hasFrame } = fixture()
  const player = createVideoPlayback(false)
  const a = video(1000)
  const b = video(3000)
  await player.play(a)
  tick(200)
  await player.play(b)
  tick(300)
  expect([a.currentTime, b.currentTime]).toEqual([500, 300])
  player.pause(a)
  tick(300)
  expect([a.currentTime, b.currentTime]).toEqual([500, 600])
  expect([a.playing, b.playing]).toEqual([false, true])
  await player.play(a)
  tick(600)
  expect([a.currentTime, b.currentTime]).toEqual([1000, 1200])
  expect(player.isPlaying(a)).toBe(false)
  await player.play(a)
  expect([a.currentTime, b.currentTime]).toEqual([0, 1200])
  player.reset()
  expect([a.playing, b.playing, hasFrame()]).toEqual([false, false, false])
})

it('暂停全局播放中的视频保留当前帧；循环、删除和换源均独立处理', async () => {
  const { tick, hasFrame } = fixture()
  const player = createVideoPlayback(true)
  const a = video(1000)
  const b = video(3000)
  a.setLocalTime(400)
  player.pause(a)
  expect(a.currentTime).toBe(400)
  await player.play(a)
  await player.play(b)
  tick(800)
  expect([a.currentTime, b.currentTime]).toEqual([200, 800])
  a.src = 'changed.mp4'
  tick(200)
  expect(player.isPlaying(a)).toBe(false)
  expect(b.currentTime).toBe(1000)
  b.isInsideTree = () => false
  tick(100)
  expect(hasFrame()).toBe(false)
})

it.each(['pause', 'reset'] as const)('加载期间 %s 不会在加载完成后意外起播', async (action) => {
  const { hasFrame } = fixture()
  const player = createVideoPlayback(false)
  const a = video()
  let loaded!: () => void
  a.waitLoad = () => new Promise<void>((resolve) => {
    loaded = resolve
  })
  const promise = player.play(a)
  if (action === 'pause')
    player.pause(a)
  else
    player.reset()
  loaded()
  await promise
  expect(player.isPlaying(a)).toBe(false)
  expect(hasFrame()).toBe(false)
})

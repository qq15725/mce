import type { Video2D } from 'modern-canvas'
import { shallowReactive } from 'vue'

/** 每个视频使用自己的本地时钟；不修改画布时间轴。 */
export function createVideoPlayback(loop: boolean) {
  const active = shallowReactive(new Map<Video2D, { stamp: number, src: string }>())
  const pending = new WeakMap<Video2D, symbol>()
  let epoch = 0
  let raf: number | undefined

  function pause(node: Video2D) {
    pending.delete(node)
    active.delete(node)
    if (!node.standalone)
      node.setLocalTime(node.currentTime)
    node.setStandalonePlaying(false)
    if (!active.size && raf !== undefined) {
      cancelAnimationFrame(raf)
      raf = undefined
    }
  }

  function frame(now: number) {
    raf = undefined
    for (const [node, playback] of active) {
      const duration = node.videoDuration
      if (!node.isInsideTree() || node.src !== playback.src || !Number.isFinite(duration) || duration <= 0) {
        pause(node)
        continue
      }
      const time = node.currentTime + Math.max(0, now - playback.stamp)
      playback.stamp = now
      node.setLocalTime(loop ? time % duration : Math.min(time, duration))
      if (!loop && time >= duration)
        pause(node)
    }
    if (active.size)
      raf = requestAnimationFrame(frame)
  }

  async function play(node: Video2D, restart = false) {
    const token = Symbol('play')
    const version = epoch
    const src = node.src
    pending.set(node, token)
    await node.waitLoad()
    if (version !== epoch || pending.get(node) !== token || node.src !== src || !node.isInsideTree())
      return
    pending.delete(node)
    if (!Number.isFinite(node.videoDuration) || node.videoDuration <= 0)
      return
    const time = restart || !node.standalone || node.currentTime >= node.videoDuration ? 0 : node.currentTime
    node.loop = loop
    node.setLocalTime(time)
    node.setStandalonePlaying(true)
    active.set(node, { stamp: performance.now(), src: node.src })
    if (raf === undefined)
      raf = requestAnimationFrame(frame)
  }

  function reset() {
    epoch++
    for (const node of active.keys())
      pause(node)
  }

  return { play, pause, reset, isPlaying: (node: Video2D) => active.has(node) }
}

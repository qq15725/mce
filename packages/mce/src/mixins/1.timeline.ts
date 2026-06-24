import type { Node } from 'modern-canvas'
import type { Ref, WritableComputedRef } from 'vue'
import { clamp, TimelineNode, Video2D } from 'modern-canvas'
import { computed, ref } from 'vue'
import { defineMixin } from '../mixin'

declare global {
  namespace Mce {
    interface Editor {
      msPerPx: Ref<number>
      currentTime: WritableComputedRef<number>
      startTime: WritableComputedRef<number>
      endTime: WritableComputedRef<number>
      getTimeRange: (node?: Node | Node[]) => { startTime: number, endTime: number }
    }
  }
}

export default defineMixin((editor) => {
  const {
    isElement,
    root,
    timeline,
  } = editor

  const msPerPx = ref(10)
  const currentTime = computed({
    get: () => timeline.value.currentTime,
    set: (val) => {
      const { startTime, endTime } = timeline.value
      timeline.value.currentTime = clamp(val, startTime, endTime)
    },
  })
  const startTime = computed({
    get: () => timeline.value.startTime,
    set: val => timeline.value.startTime = val,
  })
  const endTime = computed({
    get: () => timeline.value.endTime,
    set: val => timeline.value.endTime = val,
  })

  const getTimeRange: Mce.Editor['getTimeRange'] = (node = root.value) => {
    const range = { startTime: 0, endTime: 0 }

    function handle(node: Node) {
      if (node instanceof TimelineNode) {
        range.startTime = Math.min(range.startTime, node.globalStartTime)
        range.endTime = Math.max(range.endTime, node.globalEndTime)
      }

      if (isElement(node)) {
        for (const layer of [node.background, node.foreground, node.fill, node.outline]) {
          if (layer.animatedTexture) {
            range.endTime = Math.max(range.endTime, node.globalStartTime + layer.animatedTexture.duration)
          }
        }
      }

      if (node instanceof Video2D) {
        // videoDuration 在元数据未就绪时为 NaN（videoDuration 的 `?? 0` 挡不住 NaN）。NaN 一旦混入
        // endTime，会沿引擎 loop 取模传到 Video2D.currentTime，触发 HTMLMediaElement「non-finite」崩溃。
        if (node.texture && Number.isFinite(node.videoDuration)) {
          range.endTime = Math.max(range.endTime, node.globalStartTime + node.videoDuration)
        }
      }

      return false
    }

    const nodes = Array.isArray(node) ? node : [node]
    nodes.forEach(node => node.findOne(handle))

    return range
  }

  Object.assign(editor, {
    msPerPx,
    currentTime,
    startTime,
    endTime,
    getTimeRange,
  })
})

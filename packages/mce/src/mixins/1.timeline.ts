import type { Node } from 'modern-canvas'
import type { ComputedRef, Ref } from 'vue'
import { assets, clamp, Element2D, TimelineNode } from 'modern-canvas'
import { computed, ref } from 'vue'
import { defineMixin } from '../editor'

declare global {
  namespace Mce {
    interface Editor {
      msPerPx: Ref<number>
      currentTime: ComputedRef<number>
      startTime: ComputedRef<number>
      endTime: ComputedRef<number>
      getTimeRange: (node: Node | Node[]) => { startTime: number, endTime: number }
    }
  }
}

export default defineMixin((editor) => {
  const {
    root,
    timeline,
    renderEngine,
  } = editor

  const msPerPx = ref(0.1)
  const currentTime = computed({
    get: () => timeline.value.currentTime,
    set: (val) => {
      const { startTime, endTime } = timeline.value
      timeline.value.currentTime = clamp(val, startTime, endTime)
    },
  })
  const startTime = computed(() => timeline.value.startTime)
  const endTime = computed(() => timeline.value.endTime)

  const getTimeRange: Mce.Editor['getTimeRange'] = (node) => {
    const range = { startTime: 0, endTime: 0 }

    function handle(node: Node) {
      if (node instanceof TimelineNode) {
        range.startTime = Math.min(range.startTime, node.globalStartTime)
        range.endTime = Math.max(range.endTime, node.globalEndTime)
      }

      if (node instanceof Element2D) {
        if (node.background.animatedTexture) {
          range.endTime = Math.max(range.endTime, node.globalStartTime + node.background.animatedTexture.duration)
        }
        if (node.foreground.animatedTexture) {
          range.endTime = Math.max(range.endTime, node.globalStartTime + node.foreground.animatedTexture.duration)
        }
        if (node.fill.animatedTexture) {
          range.endTime = Math.max(range.endTime, node.globalStartTime + node.fill.animatedTexture.duration)
        }
        if (node.outline.animatedTexture) {
          range.endTime = Math.max(range.endTime, node.globalStartTime + node.outline.animatedTexture.duration)
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

  return () => {
    const {
      on,
    } = editor

    async function updateEndTime() {
      await renderEngine.value.nextTick()
      timeline.value.endTime = root.value
        ? getTimeRange(root.value).endTime
        : 0
    }

    assets.on('loaded', updateEndTime)

    on('setDoc', updateEndTime)
  }
})

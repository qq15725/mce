import type { Node } from 'modern-canvas'
import type { Ref, WritableComputedRef } from 'vue'
import { clamp, TimelineNode, Video2D } from 'modern-canvas'
import { computed, onBeforeMount, onScopeDispose, ref } from 'vue'
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
    renderEngine,
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

      if (node instanceof Video2D) {
        if (node.texture) {
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

  return () => {
    const {
      assets,
      on,
      off,
      exec,
    } = editor

    async function updateEndTime() {
      await renderEngine.value.nextTick()
      timeline.value.endTime = root.value
        ? getTimeRange(root.value).endTime
        : 0

      if (!exec('isUiVisible', 'timeline')) {
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
  }
})

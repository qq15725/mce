<script setup lang="ts">
import type { TimelineNode } from 'modern-canvas'
import { Animation, Element2D, Video2D } from 'modern-canvas'
import { computed } from 'vue'
import { useEditor, useNode } from '../../composables'

type BlockKind = 'animation' | 'media' | 'video'

interface BlockItem {
  kind: BlockKind
  delay: number
  duration: number
  anim?: Animation
  label?: string
}

const props = withDefaults(defineProps<{
  node: TimelineNode
  endTime: number
  msPerPx?: number
  active?: boolean
}>(), {
  msPerPx: 1,
})

const editor = useEditor()
const { root, currentTime, fps, recomputeTimelineEndTime, selection } = editor

const { thumbnailName } = useNode(
  computed(() => props.node),
)

const blocks = computed<BlockItem[]>(() => {
  const node = props.node
  const items: BlockItem[] = []

  if (node instanceof Video2D) {
    const d = node.videoDuration || 0
    if (d > 0) {
      items.push({ kind: 'video', delay: 0, duration: d, label: 'Video' })
    }
  }

  if (node instanceof Element2D) {
    for (const slot of ['background', 'foreground', 'fill', 'outline'] as const) {
      const tx = node[slot]?.animatedTexture
      if (tx?.duration) {
        items.push({ kind: 'media', delay: 0, duration: tx.duration, label: slot })
      }
    }
    node.children.forEach((child) => {
      if (child instanceof Animation) {
        items.push({
          kind: 'animation',
          delay: child.delay,
          duration: child.duration,
          anim: child,
        })
      }
    })
  }

  return items
})

function blockStyle(b: BlockItem): Record<string, string> {
  return {
    left: `${b.delay / props.msPerPx}px`,
    width: b.duration > 0
      ? `${b.duration / props.msPerPx}px`
      : '100%',
  }
}

const style = computed(() => {
  const node = props.node
  const { duration: _duration = 0, delay = 0 } = node
  // Prefer the actual span of contained blocks so the segment hugs its content.
  // Fall back to the element's own duration or the full timeline when empty.
  let contentEnd = 0
  for (const b of blocks.value) {
    contentEnd = Math.max(contentEnd, b.delay + b.duration)
  }
  const duration = contentEnd || _duration || (props.endTime - delay)
  return {
    transform: `translateX(${delay / props.msPerPx}px)`,
    width: `${duration / props.msPerPx}px`,
  }
})

function collectSnapTargets(exclude: TimelineNode): number[] {
  const targets: number[] = [0, props.endTime, currentTime.value]
  root.value.findAll((node) => {
    if (node === exclude)
      return false
    if (node instanceof Animation) {
      targets.push(node.delay)
      targets.push(node.delay + node.duration)
    }
    return false
  })
  return targets
}

function snap(value: number, thresholdMs: number, exclude: TimelineNode): number {
  let best = value
  let bestDist = thresholdMs
  const targets = collectSnapTargets(exclude)
  for (const t of targets) {
    const d = Math.abs(t - value)
    if (d < bestDist) {
      bestDist = d
      best = t
    }
  }
  // frame snap (lowest priority)
  if (bestDist === thresholdMs) {
    const frameMs = 1000 / fps.value
    const f = Math.round(value / frameMs) * frameMs
    if (Math.abs(f - value) < thresholdMs) {
      best = f
    }
  }
  return best
}

type DragMode = 'move' | 'resize-left' | 'resize-right'

function pickMode(e: MouseEvent, resizable: boolean): DragMode {
  if (!resizable)
    return 'move'
  const el = e.currentTarget as HTMLElement
  const rect = el.getBoundingClientRect()
  const localX = e.clientX - rect.left
  if (localX < 6)
    return 'resize-left'
  if (localX > rect.width - 6)
    return 'resize-right'
  return 'move'
}

function onBlockDown(e: MouseEvent, block: BlockItem) {
  e.stopPropagation()
  selection.value = [props.node]
  const resizable = block.kind === 'animation'
  const target: TimelineNode = block.anim ?? props.node
  const mode = pickMode(e, resizable)
  const startX = e.clientX
  const initialDelay = target.delay
  const initialDuration = resizable
    ? (target.duration || (props.endTime - initialDelay))
    : 0 // not used for media/video — duration is bound to the resource
  const minDuration = 1000 / fps.value
  const threshold = 8 * props.msPerPx

  function onMove(ev: MouseEvent) {
    const deltaMs = (ev.clientX - startX) * props.msPerPx
    if (mode === 'move') {
      const t = snap(initialDelay + deltaMs, threshold, target)
      target.delay = Math.max(0, t)
    }
    else if (mode === 'resize-left') {
      const maxDelay = initialDelay + initialDuration - minDuration
      const t = snap(initialDelay + deltaMs, threshold, target)
      const newDelay = Math.max(0, Math.min(maxDelay, t))
      target.delay = newDelay
      target.duration = initialDuration - (newDelay - initialDelay)
    }
    else if (mode === 'resize-right') {
      const t = snap(initialDelay + initialDuration + deltaMs, threshold, target)
      target.duration = Math.max(minDuration, t - initialDelay)
    }
  }

  function onUp() {
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
    recomputeTimelineEndTime()
  }

  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
}
</script>

<template>
  <div
    class="m-segment"
    :class="[
      `m-segment--${(node.meta.inEditorIs ?? 'none').toLowerCase()}`,
      active && `m-segment--active`,
    ]"
    :style="style"
  >
    <div
      v-for="(block, index) in blocks"
      :key="index"
      class="m-segment__block"
      :class="`m-segment__block--${block.kind}`"
      :style="blockStyle(block)"
      @mousedown="onBlockDown($event, block)"
    >
      <span v-if="block.label" class="m-segment__block-label">{{ block.label }}</span>
    </div>

    <div v-if="active" class="m-segment__edge m-segment__edge--front" />

    <span class="m-segment__node" style="overflow: hidden;">{{ thumbnailName }}</span>

    <div v-if="active" class="m-segment__edge m-segment__edge--end" />
  </div>
</template>

<style lang="scss">
  .m-segment {
    display: flex;
    font-size: 0.75rem;
    align-items: center;
    position: absolute;
    top: 2px;
    height: calc(100% - 4px);
    user-select: none;
    flex-wrap: nowrap;
    color: white;
    border-radius: 2px;
    background-color: #cc9641;

    &--active {
      outline: 1px solid rgb(var(--m-theme-on-surface));
    }

    &__edge {
      align-items: center;
      background-color: rgb(var(--m-theme-on-surface));
      bottom: 0;
      content: "";
      display: flex;
      justify-content: center;
      pointer-events: auto;
      position: absolute;
      top: 0;
      width: 4px;
      cursor: col-resize;

      &:before {
        background-color: rgb(var(--m-theme-surface));
        content: "";
        display: block;
        height: 10px;
        width: 2px;
      }

      &--front {
        border-bottom-left-radius: 2px;
        border-top-left-radius: 2px;
        left: 0;
      }

      &--end {
        border-bottom-right-radius: 2px;
        border-top-right-radius: 2px;
        right: 0;
      }
    }

    &__node {
      border-radius: 2px;
      padding: 2px 8px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    &__block {
      position: absolute;
      top: 0;
      height: 100%;
      border: 1px solid rgba(255, 255, 255, 0.4);
      border-radius: 2px;
      box-sizing: border-box;
      pointer-events: auto;
      overflow: hidden;

      &--animation {
        background-color: rgba(255, 255, 255, 0.18);

        &:hover {
          background-color: rgba(255, 255, 255, 0.28);
        }
      }

      &--media {
        background-color: rgba(64, 156, 96, 0.85);

        &:hover {
          background-color: rgba(64, 156, 96, 1);
        }
      }

      &--video {
        background-color: rgba(116, 84, 196, 0.85);

        &:hover {
          background-color: rgba(116, 84, 196, 1);
        }
      }
    }

    &__block-label {
      font-size: 0.625rem;
      line-height: 1;
      padding: 2px 4px;
      pointer-events: none;
      white-space: nowrap;
      opacity: 0.9;
    }
  }
</style>

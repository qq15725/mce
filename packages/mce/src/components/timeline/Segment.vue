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
const { root, currentTime, fps } = editor

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
  const duration = _duration || props.endTime - delay
  return {
    transform: `translateX(${delay / props.msPerPx}px)`,
    width: `${duration / props.msPerPx}px`,
  }
})

function collectSnapTargets(excludeAnim: Animation): number[] {
  const targets: number[] = [0, props.endTime, currentTime.value]
  root.value.findAll((node) => {
    if (node instanceof Animation && node !== excludeAnim) {
      targets.push(node.delay)
      targets.push(node.delay + node.duration)
    }
    return false
  })
  return targets
}

function snap(value: number, thresholdMs: number, exclude: Animation): number {
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

function pickMode(e: MouseEvent): DragMode {
  const el = e.currentTarget as HTMLElement
  const rect = el.getBoundingClientRect()
  const localX = e.clientX - rect.left
  if (localX < 6)
    return 'resize-left'
  if (localX > rect.width - 6)
    return 'resize-right'
  return 'move'
}

function onBlockDown(e: MouseEvent, anim: Animation) {
  e.stopPropagation()
  const mode = pickMode(e)
  const startX = e.clientX
  const initialDelay = anim.delay
  const initialDuration = anim.duration || (props.endTime - initialDelay)
  const minDuration = 1000 / fps.value
  const threshold = 8 * props.msPerPx

  function onMove(ev: MouseEvent) {
    const deltaMs = (ev.clientX - startX) * props.msPerPx
    if (mode === 'move') {
      const target = snap(initialDelay + deltaMs, threshold, anim)
      anim.delay = Math.max(0, target)
    }
    else if (mode === 'resize-left') {
      const maxDelay = initialDelay + initialDuration - minDuration
      const target = snap(initialDelay + deltaMs, threshold, anim)
      const newDelay = Math.max(0, Math.min(maxDelay, target))
      anim.delay = newDelay
      anim.duration = initialDuration - (newDelay - initialDelay)
    }
    else if (mode === 'resize-right') {
      const target = snap(initialDelay + initialDuration + deltaMs, threshold, anim)
      anim.duration = Math.max(minDuration, target - initialDelay)
    }
  }

  function onUp() {
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
  }

  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
}

function onBlockMove(e: MouseEvent) {
  const target = e.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  const localX = e.clientX - rect.left
  target.style.cursor = localX < 6 || localX > rect.width - 6
    ? 'col-resize'
    : 'grab'
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
      @mousedown="block.anim && onBlockDown($event, block.anim)"
      @mousemove="block.kind === 'animation' && onBlockMove($event)"
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
        cursor: grab;

        &:hover {
          background-color: rgba(255, 255, 255, 0.28);
        }

        &:active {
          cursor: grabbing;
        }
      }

      &--media {
        background-color: rgba(64, 156, 96, 0.85);
        cursor: default;
      }

      &--video {
        background-color: rgba(116, 84, 196, 0.85);
        cursor: default;
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

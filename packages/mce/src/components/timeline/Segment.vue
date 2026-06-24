<script setup lang="ts">
import type { TimelineNode } from 'modern-canvas'
import type { Keyframe } from '../../utils'
import { Animation, clamp, Element2D, Video2D } from 'modern-canvas'
import { computed } from 'vue'
import { useEditor, useNode } from '../../composables'
import { upsertKeyframe } from '../../utils'

type BlockKind = 'animation' | 'media' | 'video'

interface BlockItem {
  kind: BlockKind
  /** 列表内稳定唯一键：video / media:<slot> / 动画节点 id。 */
  id: string
  delay: number
  duration: number
  anim?: Animation
  // For animation blocks: preset category (in / out / emphasis) + label.
  category?: string
  label?: string
}

const props = withDefaults(defineProps<{
  node: TimelineNode
  endTime: number
  msPerPx?: number
  active?: boolean
  // Bumped by Timeline on asset load / poll. Lets blocks recompute when async
  // content (e.g. video duration) becomes available after the segment mounts.
  rev?: number
}>(), {
  msPerPx: 1,
})

const editor = useEditor()
const { root, currentTime, fps, recomputeTimelineEndTime, selection, keyframeEditing, t } = editor

const CHANNEL_DEFAULTS: Record<string, number> = {
  left: 0,
  top: 0,
  rotate: 0,
  scaleX: 1,
  scaleY: 1,
  opacity: 1,
}

const { thumbnailName } = useNode(
  computed(() => props.node),
)

const blocks = computed<BlockItem[]>(() => {
  void props.rev
  const node = props.node
  const items: BlockItem[] = []

  if (node instanceof Video2D) {
    const d = node.videoDuration || 0
    if (d > 0) {
      items.push({ kind: 'video', id: 'video', delay: 0, duration: d })
    }
  }

  if (node instanceof Element2D) {
    for (const slot of ['background', 'foreground', 'fill', 'outline'] as const) {
      const tx = node[slot]?.animatedTexture
      if (tx?.duration) {
        items.push({ kind: 'media', id: `media:${slot}`, delay: 0, duration: tx.duration })
      }
    }
    node.children.forEach((child) => {
      if (child instanceof Animation) {
        const meta = (child.meta as any)?.toJSON?.() ?? {}
        items.push({
          kind: 'animation',
          id: child.id,
          delay: child.delay,
          duration: child.duration,
          anim: child,
          category: meta.presetCategory,
          label: meta.presetId ? t(meta.presetId) : t('animationItem'),
        })
      }
    })
  }

  return items
})

// 剪映式布局：入场块靠片段头、出场靠尾（按各自 delay/duration 定位）、
// 强调贯穿整条置于底部细条；其余按 delay/duration 常规定位。
function blockStyle(b: BlockItem): Record<string, string> {
  if (b.kind === 'animation' && b.category === 'emphasis') {
    return { left: '0', right: '0', width: 'auto' }
  }
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

// Drag a timeline target (the element itself, or one of its animation children)
// by adjusting its delay; animation blocks may also resize.
function startDrag(e: MouseEvent, target: TimelineNode, resizable: boolean) {
  e.stopPropagation()
  selection.value = [props.node]
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

// Animation block: drag/resize the animation itself (relative to its element).
function onBlockDown(e: MouseEvent, block: BlockItem) {
  startDrag(e, block.anim ?? props.node, block.kind === 'animation')
}

function keyframesOf(block: BlockItem): Keyframe[] {
  return (block.anim?.keyframes as unknown as Keyframe[] | undefined) ?? []
}

// Drag a keyframe marker along the animation block to change its offset (0..1).
// Clamped strictly between neighbours so order/identity stays stable; a click
// without movement seeks the playhead to that keyframe.
function onKeyframeDown(e: MouseEvent, block: BlockItem, index: number) {
  e.stopPropagation()
  const anim = block.anim
  if (!anim)
    return
  selection.value = [props.node]
  const kfs = keyframesOf(block)
  const kf = kfs[index]
  if (!kf)
    return

  const markerEl = e.currentTarget as HTMLElement
  const duration = anim.duration || (props.endTime - anim.delay) || 1
  const startX = e.clientX
  const initialOffset = kf.offset
  const eps = 1e-3
  const lo = index > 0 ? kfs[index - 1].offset + eps : 0
  const hi = index < kfs.length - 1 ? kfs[index + 1].offset - eps : 1
  const frameMs = 1000 / fps.value
  let moved = false

  function onMove(ev: MouseEvent) {
    if (Math.abs(ev.clientX - startX) > 2)
      moved = true
    const deltaOffset = ((ev.clientX - startX) * props.msPerPx) / duration
    // Frame-snap on the absolute timeline, then clamp between neighbours.
    const timeMs = anim!.delay + (initialOffset + deltaOffset) * duration
    const snappedMs = Math.round(timeMs / frameMs) * frameMs
    const next = clamp((snappedMs - anim!.delay) / duration, lo, hi)
    const arr = keyframesOf(block)
    root.value?.transact(() => {
      anim!.keyframes = arr.map((k, i) => (i === index ? { ...k, offset: next } : k)) as any
    })
  }

  function onUp() {
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
    if (moved)
      return
    // Click (no drag): seek the playhead and open the editing popover on this marker.
    currentTime.value = anim!.delay + initialOffset * duration
    const rect = markerEl.getBoundingClientRect()
    keyframeEditing.value = {
      anim: anim!,
      offset: initialOffset,
      target: { x: rect.left + rect.width / 2, y: rect.top },
    }
  }

  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
}

function readChannels(node: Element2D): Record<string, number> {
  const s = node.style as any
  const out: Record<string, number> = {}
  for (const key of Object.keys(CHANNEL_DEFAULTS)) {
    const v = s?.[key]
    out[key] = typeof v === 'number' ? v : CHANNEL_DEFAULTS[key]
  }
  return out
}

// Double-click empty area of an animation block to add a keyframe there
// (snapshotting the element's current style), then open the popover on it.
function onBlockDblClick(e: MouseEvent, block: BlockItem) {
  if (block.kind !== 'animation' || !block.anim)
    return
  // Ignore double-clicks landing on an existing marker.
  if (e.target !== e.currentTarget)
    return
  const anim = block.anim
  const el = props.node
  if (!(el instanceof Element2D))
    return
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const duration = anim.duration || (props.endTime - anim.delay) || 1
  const frameMs = 1000 / fps.value
  const rawMs = anim.delay + clamp((e.clientX - rect.left) / rect.width, 0, 1) * duration
  const offset = clamp((Math.round(rawMs / frameMs) * frameMs - anim.delay) / duration, 0, 1)

  selection.value = [el]
  root.value?.transact(() => {
    anim.keyframes = upsertKeyframe(keyframesOf(block), { offset, ...readChannels(el) }) as any
  })
  currentTime.value = anim.delay + offset * duration
  keyframeEditing.value = { anim, offset, target: { x: e.clientX, y: rect.top } }
}

// Segment body / name handle: move the whole element track (shifts the element
// and all its animations together). Blocks stop propagation so they take over.
function onSegmentDown(e: MouseEvent) {
  startDrag(e, props.node, false)
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
    @mousedown="onSegmentDown"
  >
    <div
      v-for="block in blocks"
      :key="block.id"
      class="m-segment__block"
      :class="[
        `m-segment__block--${block.kind}`,
        block.kind === 'animation' && block.category && `m-segment__block--${block.category}`,
        block.kind === 'animation' && block.category === 'emphasis' && 'm-segment__block--strip',
      ]"
      :style="blockStyle(block)"
      :title="block.kind === 'animation' ? block.label : undefined"
      @mousedown="onBlockDown($event, block)"
      @dblclick="onBlockDblClick($event, block)"
    >
      <span
        v-if="block.kind === 'animation' && block.label && block.category !== 'emphasis'"
        class="m-segment__label"
      >{{ block.label }}</span>
      <button
        v-for="(kf, ki) in (block.kind === 'animation' ? keyframesOf(block) : [])"
        :key="ki"
        type="button"
        class="m-segment__kf"
        :style="{ left: `${kf.offset * 100}%` }"
        :title="`${Math.round(kf.offset * 100)}%`"
        @mousedown="onKeyframeDown($event, block, ki)"
      />
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

    &__label {
      position: absolute;
      left: 6px;
      top: 50%;
      transform: translateY(-50%);
      z-index: 1;
      pointer-events: none;
      font-size: 0.7rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: calc(100% - 12px);
      color: white;
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
      // Sits above the absolutely-positioned blocks so it stays a grabbable
      // handle for moving the whole element track, even when a block (e.g. an
      // animation that spans the full segment) covers the bar.
      position: relative;
      z-index: 2;
      cursor: move;
      border-radius: 2px;
      padding: 1px 6px;
      background-color: rgba(0, 0, 0, 0.22);
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

      // Plain keyframe animation (no preset): no fill — just a thin centre line
      // with diamonds drawn on the clip (CapCut / Premiere style), so it doesn't
      // double up on the element bar.
      &--animation {
        top: 0;
        height: 100%;
        background-color: transparent;
        border: 0;
        overflow: visible; // let keyframe markers at offset 0/1 show fully

        &::before {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          top: 50%;
          height: 2px;
          transform: translateY(-50%);
          border-radius: 1px;
          background-color: rgba(255, 255, 255, 0.55);
        }

        &:hover::before {
          background-color: rgba(255, 255, 255, 0.85);
        }
      }

      // Preset animations render as solid coloured regions instead of a line.
      &--in,
      &--out {
        top: 2px;
        height: 66%;
        border: 1px solid rgba(255, 255, 255, 0.5);
        border-radius: 2px;

        &::before {
          display: none;
        }
      }

      &--in {
        background-color: rgba(64, 156, 96, 0.92);
      }

      &--out {
        background-color: rgba(204, 88, 66, 0.92);
      }

      &--emphasis {
        background-color: rgba(82, 116, 214, 0.92);
        border: 1px solid rgba(255, 255, 255, 0.4);

        &::before {
          display: none;
        }
      }

      &--strip {
        top: auto;
        bottom: 0;
        height: 28%;
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

    &__kf {
      position: absolute;
      top: 50%;
      width: 8px;
      height: 8px;
      margin: 0;
      padding: 0;
      border: 1px solid rgba(0, 0, 0, 0.45);
      border-radius: 1px;
      background-color: #fff;
      transform: translate(-50%, -50%) rotate(45deg);
      cursor: ew-resize;
      z-index: 2;

      &:hover {
        background-color: #ffe2a8;
      }
    }
  }
</style>

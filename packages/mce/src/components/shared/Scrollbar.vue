<script setup lang="ts">
import { vResizeObserver } from '@vueuse/components'
import { useDebounceFn } from '@vueuse/core'
import { computed, ref, useTemplateRef } from 'vue'
import { addDragListener } from '../../utils'

const props = defineProps<{
  length: number
  vertical?: boolean
  size: number
  offset: number
}>()
const emit = defineEmits<{
  scroll: [offset: number]
}>()

const position = defineModel<number>({ required: true })

const track = useTemplateRef('trackTplRef')
const thumb = useTemplateRef('thumbTplRef')
const trackLength = ref(0)
// 屏幕坐标下内容占据 [0, length]，视口占据 [position, position + trackLength]。
// 无限画布没有硬边界，滚动区间取「内容 ∪ 视口」并在两侧各留半屏空白：
// 内容居中时滑块居中，空内容（length 为 0）时纵横都停在正中，而不是塌成 NaN 或钉在末端。
function measure(pos: number) {
  const viewLength = trackLength.value
  const scrollStart = Math.min(0, pos) - viewLength / 2
  const scrollEnd = Math.max(props.length, pos + viewLength) + viewLength / 2
  const scrollLength = scrollEnd - scrollStart
  // 可滚动距离：滑块从轨道一端走到另一端时 position 的变化量
  const scrollRange = scrollLength - viewLength
  return {
    scrollRange,
    length: scrollLength > 0
      ? Math.max(0.05, Math.min(1, viewLength / scrollLength))
      : 1,
    position: scrollRange > 0
      ? Math.min(1, Math.max(0, (pos - scrollStart) / scrollRange))
      : 0,
  }
}
const thumbLength = computed(() => measure(position.value).length)
const thumbPosition = computed(() => measure(position.value).position)
const resize = useDebounceFn(() => {
  const box = track.value?.getBoundingClientRect() ?? { width: 0, height: 0 }
  trackLength.value = props.vertical ? box.height : box.width
}, 50)

const start = computed(() => thumbPosition.value * (1 - thumbLength.value))
const end = computed(() => 1 - start.value - thumbLength.value)
const thumbTop = computed(() => props.vertical ? `${start.value * 100}%` : '0%')
const thumbBottom = computed(() => props.vertical ? `${end.value * 100}%` : '50%')
const thumbLeft = computed(() => props.vertical ? '0%' : `${start.value * 100}%`)
const thumbRight = computed(() => props.vertical ? '50%' : `${end.value * 100}%`)

function update(val: number) {
  emit('scroll', val - position.value)
  position.value = val
}
function amount(val: number) {
  update(position.value + val)
}

// 滑块在轨道上的像素位置（长度也随 position 变，所以整体算）
function thumbOffsetPx(pos: number): number {
  const m = measure(pos)
  return m.position * trackLength.value * (1 - m.length)
}

// 滑块像素位置对 position 的变化率（中心差分）
function slopeAt(pos: number): number {
  const eps = Math.max(1, Math.abs(pos) * 1e-3)
  return (thumbOffsetPx(pos + eps) - thumbOffsetPx(pos - eps)) / (eps * 2)
}

// 滚动区间随平移一起扩张（无限画布没有硬边界），滑块位移与 position 不成正比，
// 直接按区间长度换算会明显拖不动。改用局部斜率反解，并用中点再校正一次抵消超调，
// 让拖动尽量跟手 1:1。
function scrollByThumb(offsetPx: number) {
  const travel = trackLength.value * (1 - thumbLength.value)
  if (travel <= 0) {
    return
  }
  const pos = position.value
  // 内容整体在视口内时滑块恒居中（斜率为 0），此时退化成按区间线性平移
  const fallback = offsetPx / travel * measure(pos).scrollRange
  const slope = slopeAt(pos)
  const guess = slope > 0 ? offsetPx / slope : fallback
  const midSlope = slopeAt(pos + guess / 2)
  amount(midSlope > 0 ? offsetPx / midSlope : guess)
}

const isActive = ref(false)

function onPointerdown(event: MouseEvent) {
  if (!thumb.value?.contains(event.target as Node)) {
    return
  }

  addDragListener(event, {
    threshold: 3,
    start: () => isActive.value = true,
    move: ({ movePoint, lastPoint }) => {
      const offset = {
        x: lastPoint.x - movePoint.x,
        y: lastPoint.y - movePoint.y,
      }
      scrollByThumb((props.vertical ? offset.y : offset.x) * -1)
    },
    end: () => isActive.value = false,
  })
}
</script>

<template>
  <div
    v-resize-observer="resize"
    class="m-scrollbar"
    :class="{
      'm-scrollbar--vertical': props.vertical,
      'm-scrollbar--horizontal': !props.vertical,
    }"
    :style="{
      [props.vertical ? 'height' : 'width']: `calc(100% - ${props.size + props.offset}px)`,
      [props.vertical ? 'width' : 'height']: `${props.size}px`,
      [props.vertical ? 'top' : 'left']: `${props.offset}px`,
    }"
  >
    <div
      ref="trackTplRef"
      class="m-scrollbar__track"
    >
      <div
        ref="thumbTplRef"
        class="m-scrollbar__thumb"
        :class="{
          'm-scrollbar__thumb--active': isActive,
        }"
        :style="{
          top: thumbTop,
          bottom: thumbBottom,
          left: thumbLeft,
          right: thumbRight,
        }"
        @pointerdown="onPointerdown"
      />
    </div>
  </div>
</template>

<style lang="scss">
.m-scrollbar {
  position: absolute;
  display: flex;
  pointer-events: auto !important;

  &--vertical {
    right: 0;
    flex-direction: column;
  }

  &--horizontal {
    bottom: 0;
  }

  &__track {
    flex: 1;
  }

  &__thumb {
    position: absolute;
    border-radius: calc(infinity * 1px);
    background-color: rgba(var(--m-theme-on-background), var(--m-low-emphasis-opacity));
    backdrop-filter: blur(var(--m-blur));

    &--active,
    &:hover {
      background-color: rgba(var(--m-theme-on-background), var(--m-medium-emphasis-opacity));
    }
  }
}
</style>

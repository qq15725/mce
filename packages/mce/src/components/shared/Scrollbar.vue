<script setup lang="ts">
import { vOnLongPress, vResizeObserver } from '@vueuse/components'
import { useDebounceFn } from '@vueuse/core'
import { computed, onBeforeUnmount, ref, useTemplateRef } from 'vue'

const props = defineProps<{
  zoom: number
  length: number
  vertical?: boolean
  infinite?: boolean
  size: number
  offset: number
}>()
const emit = defineEmits<{
  scroll: [offset: number]
}>()

const lerp = (a: number, b: number, t: number): number => a * (1 - t) + b * t
const thumbToTrack = (thumbLength: number, thumbPosition: number): number => lerp(thumbLength / 2, 1 - thumbLength / 2, thumbPosition)

const offset = defineModel<number>({ required: true })

const track = useTemplateRef('trackTplRef')
const thumb = useTemplateRef('thumbTplRef')
const trackLength = ref(0)
const contentLength = computed(() =>
  props.infinite
    ? props.length * props.zoom + trackLength.value + Math.abs(offset.value) * 2
    : (offset.value > 0
        ? offset.value + props.length * props.zoom
        : Math.max(trackLength.value - offset.value, props.length * props.zoom)),
)
const scrollOffset = computed(() => props.infinite
  ? Math.abs(offset.value) - offset.value
  : (offset.value > 0
      ? 0
      : -offset.value),
)
const thumbLength = computed(() => {
  return Math.max(0.05, Math.min(1, trackLength.value / contentLength.value))
})
const thumbPosition = computed(() => scrollOffset.value / (contentLength.value - trackLength.value) * (1 - thumbLength.value))
const resize = useDebounceFn(() => {
  const box = track.value?.getBoundingClientRect() ?? { width: 0, height: 0 }
  trackLength.value = props.vertical ? box.height : box.width
}, 50)

const start = computed(() => props.infinite ? thumbToTrack(thumbLength.value, thumbPosition.value) : thumbPosition.value)
const end = computed(() => 1 - start.value - thumbLength.value)
const thumbTop = computed(() => props.vertical ? `${start.value * 100}%` : '0%')
const thumbBottom = computed(() => props.vertical ? `${end.value * 100}%` : '50%')
const thumbLeft = computed(() => props.vertical ? '0%' : `${start.value * 100}%`)
const thumbRight = computed(() => props.vertical ? '50%' : `${end.value * 100}%`)

function update(val: number) {
  emit('scroll', val - offset.value)
  offset.value = val
}
function amount(val: number) {
  update(offset.value + val)
}

const actived = ref(false)
// useMouseAction(track, {
//   start({ event }) {
//     if (!thumb.value?.contains(event.target as Node)) {
//       return
//     }
//     event.stopPropagation()
//     actived.value = true
//   },
//   drag({ duration: [x, y] }) {
//     if (!actived.value) {
//       return
//     }
//     if (props.infinite) {
//       amount((props.vertical ? y : x) / (trackLength.value * (1 - thumbLength.value)) * contentLength.value * props.zoom * -1)
//     }
//     else {
//       amount(-(props.vertical ? y : x))
//     }
//   },
//   end() {
//     actived.value = false
//   },
// })
const AMOUNT_STEP = 50
const AMOUNT_REPEAR_DELAY = 50
let clearId: NodeJS.Timeout
function startAmount(e: PointerEvent) {
  const el = e.target as HTMLElement
  let direction = 0
  if (thumb.value?.contains(el)) {
    stopAmount()
    return
  }
  else if (track.value?.contains(el)) {
    const point = (props.vertical ? e.offsetY : e.offsetX) / trackLength.value
    if (point < start.value) {
      direction = 1
    }
    else if (point > 1 - end.value) {
      direction = -1
    }
    else {
      stopAmount()
      return
    }
  }
  amount(AMOUNT_STEP * direction)
  clearId = setTimeout(() => startAmount(e), AMOUNT_REPEAR_DELAY)
}
function stopAmount() {
  clearTimeout(clearId)
}
onBeforeUnmount(() => {
  stopAmount()
})
</script>

<template>
  <div
    v-resize-observer="resize"
    v-on-long-press="[startAmount, { delay: AMOUNT_REPEAR_DELAY, onMouseUp: stopAmount }]"
    class="mce-scrollbar"
    :class="{
      'mce-scrollbar--vertical': props.vertical,
      'mce-scrollbar--horizontal': !props.vertical,
    }"
    :style="{
      [props.vertical ? 'height' : 'width']: `calc(100% - ${props.size + props.offset}px)`,
      [props.vertical ? 'width' : 'height']: `${props.size}px`,
      [props.vertical ? 'top' : 'left']: `${props.offset}px`,
    }"
  >
    <div
      ref="trackTplRef"
      class="mce-scrollbar__track"
    >
      <div
        v-show="props.infinite || thumbLength < 1"
        ref="thumbTplRef"
        class="mce-scrollbar__thumb"
        :class="{
          'mce-scrollbar__thumb--active': actived,
        }"
        :style="{
          top: thumbTop,
          bottom: thumbBottom,
          left: thumbLeft,
          right: thumbRight,
        }"
      />
    </div>
  </div>
</template>

<style lang="scss">
.mce-scrollbar {
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
    background-color: rgba(var(--mce-theme-on-background), var(--mce-low-emphasis-opacity));
    backdrop-filter: blur(var(--mce-blur));

    &--active,
    &:hover {
      background-color: rgba(var(--mce-theme-on-background), var(--mce-medium-emphasis-opacity));
    }
  }
}
</style>

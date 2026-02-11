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
const contentLength = computed(() => {
  return props.length + trackLength.value + Math.abs(position.value) * 2
})
const thumbLength = computed(() => {
  return Math.max(0.05, Math.min(1, trackLength.value / contentLength.value))
})
const thumbPosition = computed(() => {
  return (Math.abs(position.value) + position.value)
    / (contentLength.value - trackLength.value)
    * (1 - thumbLength.value)
})
const resize = useDebounceFn(() => {
  const box = track.value?.getBoundingClientRect() ?? { width: 0, height: 0 }
  trackLength.value = props.vertical ? box.height : box.width
}, 50)

const lerp = (a: number, b: number, t: number): number => a * (1 - t) + b * t
const thumbToTrack = (thumbLength: number, thumbPosition: number): number => lerp(thumbLength / 2, 1 - thumbLength / 2, thumbPosition)
const start = computed(() => thumbToTrack(thumbLength.value, thumbPosition.value))
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

const isActive = ref(false)

function onPointerdown(event: MouseEvent) {
  if (!thumb.value?.contains(event.target as Node)) {
    return
  }

  addDragListener(event, {
    threshold: 3,
    start: () => isActive.value = true,
    move: ({ movePoint, currentPoint }) => {
      const offset = {
        x: currentPoint.x - movePoint.x,
        y: currentPoint.y - movePoint.y,
      }
      amount((props.vertical ? offset.y : offset.x) / (trackLength.value * (1 - thumbLength.value)) * contentLength.value * -1)
    },
    end: () => isActive.value = false,
  })
}
</script>

<template>
  <div
    v-resize-observer="resize"
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
        ref="thumbTplRef"
        class="mce-scrollbar__thumb"
        :class="{
          'mce-scrollbar__thumb--active': isActive,
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

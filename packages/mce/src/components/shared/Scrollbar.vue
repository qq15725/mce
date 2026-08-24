<script setup lang="ts">
import type { ScrollbarDragState } from '../../utils/scrollbar'
import { vResizeObserver } from '@vueuse/components'
import { useDebounceFn } from '@vueuse/core'
import { computed, ref, shallowRef, useTemplateRef } from 'vue'
import { addDragListener } from '../../utils'
import {
  createScrollbarDrag,
  measureScrollbar,
  measureScrollbarDrag,
  scrollbarPositionFromDrag,
} from '../../utils/scrollbar'

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
const dragState = shallowRef<ScrollbarDragState>()
// 屏幕坐标下内容占据 [0, length]，视口占据 [position, position + trackLength]。
// 无限画布没有硬边界，滚动区间取「内容 ∪ 视口」并在两侧各留半屏空白：
// 内容居中时滑块居中，空内容（length 为 0）时纵横都停在正中，而不是塌成 NaN 或钉在末端。
function measure(pos: number) {
  return dragState.value
    ? measureScrollbarDrag(pos, dragState.value)
    : measureScrollbar(pos, props.length, trackLength.value)
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
const isActive = ref(false)

function onPointerdown(event: MouseEvent) {
  if (!thumb.value?.contains(event.target as Node)) {
    return
  }

  addDragListener(event, {
    threshold: 3,
    start: () => {
      dragState.value = createScrollbarDrag(position.value, props.length, trackLength.value)
      isActive.value = true
    },
    move: ({ movePoint, startPoint }) => {
      const offset = props.vertical
        ? movePoint.y - startPoint.y
        : movePoint.x - startPoint.x
      update(scrollbarPositionFromDrag(offset, dragState.value!))
    },
    end: () => {
      dragState.value = undefined
      isActive.value = false
    },
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

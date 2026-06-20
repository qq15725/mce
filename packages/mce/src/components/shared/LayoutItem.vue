<script setup lang="ts">
import type { PropType } from 'vue'
import { computed, normalizeClass, normalizeStyle, ref, toRef } from 'vue'
import { useEditor } from '../../composables'
import { makeLayoutItemProps, useLayoutItem } from '../../composables/layout'
import { addDragListener } from '../../utils'

const props = defineProps({
  class: [String, Array, Object],
  style: {
    type: [String, Array, Object],
    default: null,
  },
  position: {
    type: String as PropType<'top' | 'right' | 'bottom' | 'left'>,
    required: true,
  },
  size: {
    type: [Number, String],
    default: 300,
  },
  modelValue: {
    type: Boolean,
    default: true,
  },
  /** 是否允许拖拽分隔条调整尺寸（细条类面板如 statusbar 关闭）。 */
  resizable: {
    type: Boolean,
    default: true,
  },
  minSize: {
    type: Number,
    default: 40,
  },
  maxSize: {
    type: Number,
    default: undefined,
  },
  ...makeLayoutItemProps(),
})

const { panels } = useEditor()

// 尺寸单一来源：已记忆值（有 name 时）> 传入 size。本地 ref 实时驱动布局引擎。
const persisted = props.name ? panels.sizeRef(props.name).value : undefined
const size = ref<number | string>(persisted ?? props.size)

const { layoutItemStyles } = useLayoutItem({
  id: props.name,
  order: computed(() => Number.parseInt(String(props.order), 10)),
  position: toRef(() => props.position),
  elementSize: toRef(() => size.value),
  layoutSize: toRef(() => size.value),
  active: toRef(() => props.modelValue),
})

// 朝向主区的边缘：拖动它改尺寸。
const isHorizontal = computed(() => props.position === 'left' || props.position === 'right')

function clamp(v: number): number {
  return Math.min(Math.max(v, props.minSize), props.maxSize ?? Number.POSITIVE_INFINITY)
}

function onResizeDown(event: PointerEvent): void {
  if (event.button !== 0)
    return
  event.preventDefault()
  event.stopPropagation()
  const start = Number(size.value) || 0
  addDragListener(event, {
    move: (ctx) => {
      const dx = ctx.movePoint.x - ctx.startPoint.x
      const dy = ctx.movePoint.y - ctx.startPoint.y
      // 不同停靠边，拖向「远离主区」的方向为变大。
      const delta = props.position === 'left'
        ? dx
        : props.position === 'right'
          ? -dx
          : props.position === 'top'
            ? dy
            : -dy
      size.value = clamp(start + delta)
    },
    end: () => {
      if (props.name)
        panels.sizeRef(props.name).value = clamp(Number(size.value) || 0)
    },
  })
}
</script>

<template>
  <div
    :class="normalizeClass([
      'm-layout-item',
      `m-layout-item--${props.position}`,
      props.class,
    ])"
    :style="normalizeStyle([layoutItemStyles, props.style])"
  >
    <slot />

    <div
      v-if="resizable && modelValue"
      class="m-layout-item__resize"
      :class="`m-layout-item__resize--${props.position}`"
      :style="{ cursor: isHorizontal ? 'ew-resize' : 'ns-resize' }"
      @pointerdown="onResizeDown"
    />
  </div>
</template>

<style lang="scss">
  .m-layout-item {
    position: absolute;

    &--absolute {
      position: absolute;
    }

    &--left {
      border-right: 1px solid rgba(var(--m-border-color), var(--m-border-opacity));
    }

    &--top {
      border-bottom: 1px solid rgba(var(--m-border-color), var(--m-border-opacity));
    }

    &--right {
      border-left: 1px solid rgba(var(--m-border-color), var(--m-border-opacity));
    }

    &--bottom {
      border-top: 1px solid rgba(var(--m-border-color), var(--m-border-opacity));
    }

    // 朝向主区一侧的拖拽分隔条。
    &__resize {
      position: absolute;
      z-index: 1;
      touch-action: none;

      &--left,
      &--right {
        top: 0;
        width: 6px;
        height: 100%;
      }

      &--top,
      &--bottom {
        left: 0;
        width: 100%;
        height: 6px;
      }

      &--left { right: -3px; }
      &--right { left: -3px; }
      &--top { bottom: -3px; }
      &--bottom { top: -3px; }
    }
  }
</style>

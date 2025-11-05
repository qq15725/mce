<script setup lang="ts">
import type { PropType } from 'vue'
import { computed, toRef } from 'vue'
import { makeLayoutItemProps, useLayoutItem } from '../../composables/layout'

const props = defineProps({
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
  ...makeLayoutItemProps(),
})

const { layoutItemStyles } = useLayoutItem({
  id: props.name,
  order: computed(() => Number.parseInt(String(props.order), 10)),
  position: toRef(() => props.position),
  elementSize: toRef(() => props.size),
  layoutSize: toRef(() => props.size),
  active: toRef(() => props.modelValue),
  absolute: toRef(() => props.absolute),
})
</script>

<template>
  <div
    class="mce-layout-item"
    :class="[
      `mce-layout-item--${props.position}`,
    ]"
    :style="[layoutItemStyles]"
  >
    <slot />
  </div>
</template>

<style lang="scss">
  .mce-layout-item {
    position: absolute;

    &--absolute {
      position: absolute;
    }

    &--left {
      border-right: 1px solid rgba(var(--mce-border-color), var(--mce-border-opacity));
    }

    &--top {
      border-bottom: 1px solid rgba(var(--mce-border-color), var(--mce-border-opacity));
    }

    &--right {
      border-left: 1px solid rgba(var(--mce-border-color), var(--mce-border-opacity));
    }

    &--bottom {
      border-top: 1px solid rgba(var(--mce-border-color), var(--mce-border-opacity));
    }
  }
</style>

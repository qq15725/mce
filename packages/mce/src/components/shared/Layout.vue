<script setup lang="ts">
import { normalizeClass, normalizeStyle } from 'vue'
import { createLayout, makeLayoutProps } from '../../composables/layout'

const props = defineProps({
  class: [String, Array, Object],
  style: {
    type: [String, Array, Object],
    default: null,
  },
  ...makeLayoutProps(),
})

const {
  layoutClasses,
  layoutStyles,
  items,
  getLayoutItem,
  layoutRef,
} = createLayout(props)

defineExpose({
  items,
  getLayoutItem,
})
</script>

<template>
  <div
    :ref="layoutRef"
    :class="normalizeClass([layoutClasses, props.class])"
    :style="normalizeStyle([layoutStyles, props.style])"
  >
    <slot />
  </div>
</template>

<style lang="scss">
  .mce-layout {
    --mce-scrollbar-offset: 0px;
    display: flex;
    flex: 1 1 auto;

    &--full-height {
      --mce-scrollbar-offset: inherit;
      height: 100%;
    }
  }
</style>

<script setup lang="ts">
import { createLayout, makeLayoutProps } from '../../composables/layout'

const props = defineProps({
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
    :class="[layoutClasses]"
    :style="[layoutStyles]"
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

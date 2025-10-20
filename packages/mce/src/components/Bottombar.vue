<script setup lang="ts">
import { computed } from 'vue'
import { useEditor } from '../composables/editor'

const {
  config,
} = useEditor()

const style = computed(() => {
  let padding = 8
  if (config.value.scrollbar) {
    padding += 16
  }
  return {
    bottom: `${padding}px`,
    left: `${padding}px`,
    right: `${padding}px`,
  }
})
</script>

<template>
  <div
    class="mce-bottombar"
    :style="style"
  >
    <slot />
  </div>
</template>

<style lang="scss">
.mce-bottombar {
  position: absolute;
}
</style>

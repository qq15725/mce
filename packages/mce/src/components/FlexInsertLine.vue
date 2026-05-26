<script setup lang="ts">
import { computed } from 'vue'
import { useEditor } from '../composables'

defineProps<{
  line?: { left: number, top: number, width: number, height: number } | null
}>()

const { camera } = useEditor()

// Align the world-coordinate line with the camera, like the other overlays.
const mainStyleWithScale = computed(() => {
  const { zoom, position } = camera.value
  return {
    transformOrigin: 'left top',
    transform: `translate(${-position.x}px, ${-position.y}px) scale(${zoom.x}, ${zoom.y})`,
  }
})
</script>

<template>
  <div
    v-if="line"
    class="m-flex-insert"
    :style="mainStyleWithScale"
  >
    <div
      class="m-flex-insert__line"
      :style="{
        left: `${line.left}px`,
        top: `${line.top}px`,
        width: `${line.width}px`,
        height: `${line.height}px`,
      }"
    />
  </div>
</template>

<style lang="scss">
.m-flex-insert {
  position: absolute;
  left: 0;
  top: 0;
  width: 0;
  height: 0;
  overflow: visible;
  pointer-events: none;

  &__line {
    position: absolute;
    background: rgb(var(--m-theme-primary));
    border-radius: 2px;
  }
}
</style>

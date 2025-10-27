<script setup lang="ts">
import { computed } from 'vue'
import { useEditor } from '../composables/editor'
import Ruler from './shared/Ruler.vue'

defineOptions({
  inheritAttrs: false,
})

const {
  camera,
  getAabbInDrawboard,
  selection,
} = useEditor()

const activeAabb = computed(() => getAabbInDrawboard(selection.value))
</script>

<template>
  <div class="mce-rulers">
    <Ruler
      refline
      :zoom="camera.zoom.x"
      :position="camera.position.x"
      :selected="activeAabb"
      axis
      :size="16"
    />

    <Ruler
      refline
      :zoom="camera.zoom.y"
      :position="camera.position.y"
      :selected="activeAabb"
      axis
      vertical
      :size="16"
    />

    <div class="mce-rulers__left-top" />
  </div>
</template>

<style lang="scss">
  .mce-rulers {
    position: absolute;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;

    &__left-top {
      position: absolute;
      left: 0;
      top: 0;
      width: 16px;
      height: 16px;
      border: 1px solid rgba(var(--mce-border-color), var(--mce-border-opacity));
      border-top-width: 0;
      border-left-width: 0;
      background-color: rgb(var(--mce-theme-surface));
    }
  }
</style>

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
    <div
      class="mce-rulers__ruler mce-rulers__ruler--vertical"
    >
      <Ruler
        refline
        :zoom="camera.zoom.y"
        :position="camera.position.y"
        :selected="activeAabb"
        vertical
      />
    </div>

    <div
      class="mce-rulers__ruler mce-rulers__ruler--horizontal"
    >
      <Ruler
        refline
        :zoom="camera.zoom.x"
        :position="camera.position.x"
        :selected="activeAabb"
      />
    </div>

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

    &__ruler {
      position: absolute;
      left: 0;
      top: 0;

      &--vertical {
        width: 17px;
        height: 100%;
        border-right: 1px solid rgba(var(--mce-border-color), var(--mce-border-opacity));
      }

      &--horizontal {
        width: 100%;
        height: 17px;
        border-bottom: 1px solid rgba(var(--mce-border-color), var(--mce-border-opacity));
      }
    }

    &__left-top {
      position: absolute;
      left: 0;
      top: 0;
      width: 17px;
      height: 17px;
      border: 1px solid rgba(var(--mce-border-color), var(--mce-border-opacity));
      border-top-width: 0;
      border-left-width: 0;
      background-color: rgb(var(--mce-theme-surface));
    }
  }
</style>

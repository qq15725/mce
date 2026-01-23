<script setup lang="ts">
import { useEditor } from '../composables/editor'
import Scrollbar from './shared/Scrollbar.vue'

const props = withDefaults(
  defineProps<{
    offset?: number
    size?: number
  }>(),
  {
    offset: 0,
    size: 8,
  },
)

const {
  camera,
  rootAabb,
} = useEditor()
</script>

<template>
  <div class="mce-scrollbars">
    <Scrollbar
      v-bind="props"
      v-model="camera.position.y"
      vertical
      :length="rootAabb.height * camera.zoom.y"
    />

    <Scrollbar
      v-bind="props"
      v-model="camera.position.x"
      :length="rootAabb.width * camera.zoom.x"
    />
  </div>
</template>

<style lang="scss">
  .mce-scrollbars {
    position: absolute;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
  }
</style>

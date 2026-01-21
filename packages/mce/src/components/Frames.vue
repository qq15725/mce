<script lang="ts" setup>
import { useEditor } from '../composables/editor'
import Frame from './Frame.vue'

const {
  frames,
} = useEditor()
</script>

<template>
  <div class="mce-frames">
    <template
      v-for="(frame, key) in frames" :key="key"
    >
      <Frame :model-value="frame" />
    </template>
  </div>
</template>

<style lang="scss">
  .mce-frames {
    position: absolute;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
  }
</style>

<script lang="ts" setup>
import { useEditor } from '../composables/editor'
import Frame from './Frame.vue'

const {
  frames,
  getConfigRef,
} = useEditor()

const config = getConfigRef<Mce.FrameConfig>('canvas.frame')
</script>

<template>
  <div class="mce-frames">
    <template
      v-for="(frame, key) in frames" :key="key"
    >
      <Frame
        :model-value="frame"
        :outline="config.outline"
      />
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

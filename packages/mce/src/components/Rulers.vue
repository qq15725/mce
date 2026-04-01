<script setup lang="ts">
import { useEditor } from '../composables/editor'
import Ruler from './shared/Ruler.vue'

const refLines = defineModel<{
  x: number[]
  y: number[]
}>('refLines', {
  required: true,
})

const {
  getConfigRef,
  camera,
  selectionAabbInDrawboard,
} = useEditor()

const config = getConfigRef('ui.ruler')
</script>

<template>
  <div class="m-rulers">
    <Ruler
      v-model="refLines.x"
      refline
      :zoom="camera.zoom.x"
      :position="camera.position.x"
      :selected="selectionAabbInDrawboard"
      axis
      :size="16"
      :line-color="config.lineColor"
      :box-color="config.boxColor"
      :locked="config.locked"
    />

    <Ruler
      v-model="refLines.y"
      refline
      :zoom="camera.zoom.y"
      :position="camera.position.y"
      :selected="selectionAabbInDrawboard"
      axis
      vertical
      :size="16"
      :line-color="config.lineColor"
      :box-color="config.boxColor"
      :locked="config.locked"
    />

    <div class="m-rulers__left-top" />
  </div>
</template>

<style lang="scss">
  .m-rulers {
    position: absolute;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;

    &__left-top {
      position: absolute;
      left: 0;
      top: 0;
      width: 16px;
      height: 16px;
      border: 1px solid rgba(var(--m-border-color), var(--m-border-opacity));
      border-top-width: 0;
      border-left-width: 0;
      background-color: rgb(var(--m-theme-surface));
    }
  }
</style>

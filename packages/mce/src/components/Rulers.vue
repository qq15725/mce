<script setup lang="ts">
import { ref } from 'vue'
import { useEditor } from '../composables/editor'
import Ruler from './shared/Ruler.vue'

const {
  getConfigRef,
  camera,
  selectionAabbInDrawboard,
} = useEditor()

const config = getConfigRef('ui.ruler')
const hLines = ref<number[]>([])
const vLines = ref<number[]>([])
function clean() {
  hLines.value = []
  vLines.value = []
}

defineExpose({
  clean,
})
</script>

<template>
  <div class="mce-rulers">
    <Ruler
      v-model="hLines"
      refline
      :zoom="camera.zoom.x"
      :position="camera.position.x"
      :selected="selectionAabbInDrawboard"
      axis
      :size="16"
      :line-color="config.lineColor"
      :locked="config.locked"
    />

    <Ruler
      v-model="vLines"
      refline
      :zoom="camera.zoom.y"
      :position="camera.position.y"
      :selected="selectionAabbInDrawboard"
      axis
      vertical
      :size="16"
      :line-color="config.lineColor"
      :locked="config.locked"
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

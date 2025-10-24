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
  <Ruler
    :zoom="camera.zoom.y"
    vertical
    inset
    refline
    :position="camera.position.y"
    :selected="activeAabb"
  />

  <Ruler
    inset
    refline
    :zoom="camera.zoom.x"
    :position="camera.position.x"
    :selected="activeAabb"
  />
</template>

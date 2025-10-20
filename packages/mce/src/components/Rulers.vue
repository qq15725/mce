<script setup lang="ts">
import { computed } from 'vue'
import { useEditor } from '../composables/editor'
import Ruler from './shared/Ruler.vue'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<{
    size?: number
  }>(),
  {
    size: 16,
  },
)

const {
  camera,
  getAabbInDrawboard,
  selection,
} = useEditor()

const activeAabb = computed(() => getAabbInDrawboard(selection.value))
</script>

<template>
  <Ruler
    v-bind="props"
    :zoom="camera.zoom.y"
    vertical
    :offset="camera.position.y"
    :aabb="activeAabb"
  />

  <Ruler
    v-bind="props"
    :zoom="camera.zoom.x"
    :offset="camera.position.x"
    :aabb="activeAabb"
  />
</template>

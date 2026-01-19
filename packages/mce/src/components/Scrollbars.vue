<script setup lang="ts">
import { useEditor } from '../composables/editor'
import Scrollbar from './shared/Scrollbar.vue'

defineOptions({
  inheritAttrs: false,
})

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
</template>

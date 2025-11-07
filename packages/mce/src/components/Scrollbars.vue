<script setup lang="ts">
import { useEditor } from '../composables/editor'
import Scrollbar from './shared/Scrollbar.vue'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<{
    infinite?: boolean
    offset?: number
    size?: number
  }>(),
  {
    infinite: true,
    offset: 0,
    size: 8,
  },
)

const {
  camera,
  viewAabb,
} = useEditor()
</script>

<template>
  <Scrollbar
    v-bind="props"
    v-model="camera.position.y"
    vertical
    :length="viewAabb.height * camera.zoom.y"
  />

  <Scrollbar
    v-bind="props"
    v-model="camera.position.x"
    :length="viewAabb.width * camera.zoom.x"
  />
</template>

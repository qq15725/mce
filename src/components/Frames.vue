<script lang="ts" setup>
import { useEditor } from '../composables/editor'
import Frame from './Frame.vue'

const {
  frames,
} = useEditor()
</script>

<template>
  <template
    v-for="(frame, key) in frames"
    :key="key"
  >
    <Frame :model-value="frame" />
  </template>
</template>

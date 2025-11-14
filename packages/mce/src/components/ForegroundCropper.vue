<script setup lang="ts">
import { computed } from 'vue'
import { useEditor } from '../composables/editor'
import Cropper from './shared/Cropper.vue'

const {
  state,
  setState,
  elementSelection,
} = useEditor()

const element = computed(() => elementSelection.value[0])
</script>

<template>
  <Cropper
    v-if="state === 'cropping' && element?.foreground.isValid()"
    v-model="element.foreground.cropRect"
    :style="element.style.toJSON()"
    :image="element.foreground.image!"
    class="pointer-events-auto"
    @update:style="(val) => element.style.setProperties(val)"
    @end="() => setState(undefined)"
  />
</template>

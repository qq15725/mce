<script setup lang="ts">
import { computed } from 'vue'
import { useEditor } from '../composables/editor'
import Cropper from './shared/Cropper.vue'

const {
  state,
  elementSelection,
} = useEditor()

const element = computed(() => elementSelection.value[0])
const view = computed({
  get: () => ({
    left: element.value.style.left,
    top: element.value.style.top,
    width: element.value.style.width,
    height: element.value.style.height,
    scaleX: element.value.style.scaleX,
    scaleY: element.value.style.scaleY,
  }),
  set: (val) => {
    element.value.style = { ...element.value.style, ...val }
  },
})
</script>

<template>
  <Cropper
    v-if="state === 'cropping' && element?.foreground.isValid()"
    v-model="element.foreground.cropRect"
    v-model:view="view"
    class="pointer-events-auto"
    :image="element.foreground.image!"
    @end="() => state = undefined"
  >
    <template #default="scope">
      <slot v-bind="scope" />
    </template>
  </Cropper>
</template>

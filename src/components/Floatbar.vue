<script lang="ts" setup>
import { useTemplateRef, watch } from 'vue'
import { useEditor } from '../composables/editor'
import { makeMceOverlayProps } from '../composables/overlay'
import Overlay from './shared/Overlay.vue'

const props = defineProps({
  ...makeMceOverlayProps({
    location: 'top-start' as const,
    offset: 8,
  }),
})

const {
  getAabbInDrawboard,
  currentElements,
  activeElement,
  isFrame,
} = useEditor()

const overlay = useTemplateRef('overlayTpl')

function updateLocation() {
  overlay.value?.updateLocation()
}

watch(() => getAabbInDrawboard(currentElements.value), updateLocation, {
  deep: true,
})

defineExpose({
  updateLocation,
})
</script>

<template>
  <Overlay
    ref="overlayTpl"
    class="mce-floatbar"
    :location="props.location"
    :offset="activeElement && isFrame(activeElement) ? 32 : 8"
    :target="props.target"
    :attach="false"
    :model-value="true"
  >
    <template v-if="currentElements.length > 0">
      <slot />
    </template>
  </Overlay>
</template>

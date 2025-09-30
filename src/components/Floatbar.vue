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
  textSelection,
  getAabbInDrawboard,
  currentElements,
} = useEditor()

const overlayRef = useTemplateRef('overlayTplRef')

function updateLocation() {
  overlayRef.value?.updateLocation()
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
    ref="overlayTplRef"
    class="mce-floatbar"
    :location="props.location"
    :offset="props.offset"
    :target="props.target"
    :attach="props.attach"
    :model-value="true"
  >
    <template v-if="currentElements.length > 0">
      <slot
        :elements="currentElements"
        :text-selection="textSelection"
      />
    </template>
  </Overlay>
</template>

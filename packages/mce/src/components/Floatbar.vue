<script lang="ts" setup>
import { useTemplateRef, watch } from 'vue'
import { useEditor } from '../composables/editor'
import { makeMceOverlayProps } from '../composables/overlay'
import Overlay from './shared/Overlay.vue'

const props = defineProps({
  ...makeMceOverlayProps({
    middlewares: ['offset', 'shift'] as any[],
    offset: 8,
  }),
})

const {
  getAabbInDrawboard,
  selection,
  isFrame,
} = useEditor()

const overlay = useTemplateRef('overlayTpl')

function updateLocation() {
  overlay.value?.updateLocation()
}

watch(() => getAabbInDrawboard(selection.value), updateLocation, {
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
    :middlewares="props.middlewares"
    :offset="selection[0] && isFrame(selection[0]) ? 32 : 8"
    :target="props.target"
    :attach="false"
    :model-value="true"
  >
    <template v-if="selection.length > 0">
      <slot />
    </template>
  </Overlay>
</template>

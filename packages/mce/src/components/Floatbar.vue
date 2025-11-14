<script lang="ts" setup>
import { computed, useTemplateRef, watch } from 'vue'
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
  selection,
  selectionAabbInDrawboard,
  isFrame,
} = useEditor()

const overlay = useTemplateRef('overlayTpl')

const style = computed(() => {
  const location = props.location
  const aabb = selectionAabbInDrawboard.value
  if (
    location?.startsWith('top')
    || location?.startsWith('bottom')
  ) {
    return {
      width: `${aabb.width}px`,
    }
  }
  else if (
    location?.startsWith('left')
    || location?.startsWith('right')
  ) {
    return {
      height: `${aabb.height}px`,
    }
  }
  return {}
})

function updateLocation() {
  overlay.value?.updateLocation()
}

watch(selectionAabbInDrawboard, updateLocation, { deep: true })

defineExpose({
  updateLocation,
})
</script>

<template>
  <Overlay
    ref="overlayTpl"
    :style="style"
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

<style lang="scss">
  .mce-floatbar {
    overflow: visible;
  }
</style>

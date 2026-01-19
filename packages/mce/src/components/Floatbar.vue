<script lang="ts" setup>
import { computed, useTemplateRef, watch } from 'vue'
import { useEditor } from '../composables/editor'
import { makeMceOverlayProps } from '../composables/overlay'
import Overlay from './shared/Overlay.vue'

const props = defineProps({
  ...makeMceOverlayProps({
    offset: 8,
  }),
})

const {
  elementSelection,
  selectionAabbInDrawboard,
  inEditorIs,
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
      minWidth: `${aabb.width}px`,
    }
  }
  else if (
    location?.startsWith('left')
    || location?.startsWith('right')
  ) {
    return {
      minHeight: `${aabb.height}px`,
    }
  }
  return {}
})

const offset = computed(() => {
  if (
    elementSelection.value.some(v => inEditorIs(v, 'Frame'))
    || props.location?.startsWith('bottom')
  ) {
    return 32
  }
  return 8
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
    :content-style="style"
    class="mce-floatbar"
    :location="props.location"
    :middlewares="props.middlewares"
    :offset="offset"
    :target="props.target"
    :attach="false"
    :model-value="true"
  >
    <template v-if="elementSelection.length > 0">
      <slot />
    </template>
  </Overlay>
</template>

<style lang="scss">
  .mce-floatbar {
    .mce-overlay-content {
      overflow: visible;
    }
  }
</style>

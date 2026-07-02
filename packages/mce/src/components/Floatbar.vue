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
  mode,
  root,
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
      '--height': 'auto',
      '--width': `${aabb.width}px`,
    }
  }
  else if (
    location?.startsWith('left')
    || location?.startsWith('right')
  ) {
    return {
      '--height': `${aabb.height}px`,
      '--width': 'auto',
    }
  }
  return {}
})

const offset = computed(() => {
  if (props.location?.startsWith('bottom')) {
    return 32
  }
  // 顶部若有 title 标签则加大偏移让位：画板（Frame，自带标题）；
  // 工作流模式下的顶层元素（@mce/workflow 的 NodeLabel 在其上方渲染标题）。
  const hasTopTitle = elementSelection.value.some(
    v => inEditorIs(v, 'Frame')
      || (mode.value === 'workflow' && (v as any).getParent?.()?.id === root.value?.id),
  )
  return hasTopTitle ? 32 : 8
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
    class="m-floatbar"
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
  .m-floatbar {
    .m-overlay-content {
      overflow: visible;
    }
  }
</style>

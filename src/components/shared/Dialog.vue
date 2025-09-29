<script lang="ts" setup>
import { computed, useTemplateRef } from 'vue'
import { makeMceOverlayProps } from '../../composables'
import Overlay from './Overlay.vue'

const props = defineProps({
  ...makeMceOverlayProps(),
})

const isActive = defineModel<boolean>()
const overlay = useTemplateRef('overlayTpl')

const activatorProps = computed(() => {
  const _props: Record<string, any> = {
    onClick: () => isActive.value = true,
  }
  return _props
})

function updateLocation() {
  overlay.value?.updateLocation()
}

defineExpose({
  isActive,
  updateLocation,
})
</script>

<template>
  <Overlay
    ref="overlayTpl"
    v-model="isActive"
    :location="props.location"
    :offset="props.offset"
    :target="props.target"
    :attach="props.attach"
    class="mce-dialog"
  >
    <template #activator="slotProps">
      <slot
        name="activator"
        v-bind="slotProps"
        :props="{ ...slotProps.props, ...activatorProps }"
      />
    </template>

    <slot />
  </Overlay>
</template>

<style lang="scss">
.mce-dialog {
  > * {
    box-shadow: var(--mce-shadow);
  }
}
</style>

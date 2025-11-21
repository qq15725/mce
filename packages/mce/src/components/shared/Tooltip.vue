<script lang="ts" setup>
import { useTemplateRef } from 'vue'
import { makeMceOverlayProps } from '../../composables'
import Overlay from './Overlay.vue'

const props = defineProps({
  ...makeMceOverlayProps({
    location: 'right' as const,
    offset: 8,
  }),
})

const isActive = defineModel<boolean>()
const overlay = useTemplateRef('overlayTpl')

function updateLocation() {
  overlay.value?.updateLocation()
}

defineExpose({
  updateLocation,
})
</script>

<template>
  <Overlay
    ref="overlayTpl"
    v-model="isActive"
    class="mce-tooltip"
    :location="props.location"
    :offset="props.offset"
    :target="props.target"
    :attach="props.attach"
  >
    <template v-if="$slots.activator" #activator="slotProps">
      <slot
        name="activator"
        v-bind="slotProps"
        :props="{
          ...slotProps.props,
          onMouseenter: () => isActive = true,
          onMouseleave: () => isActive = false,
        }"
      />
    </template>

    <div v-if="isActive" class="mce-tooltip__content">
      <slot />
    </div>
  </Overlay>
</template>

<style lang="scss">
.mce-tooltip {
  background: rgb(var(--mce-theme-surface-variant));
  color: rgb(var(--mce-theme-on-surface-variant));
  border-radius: 4px;
  font-size: 0.75rem;
  line-height: 1;
  display: inline-block;
  padding: 8px;
  text-transform: initial;
  width: auto;
  opacity: 1;
  transition-property: opacity, transform;
  overflow-wrap: break-word;
  box-shadow: var(--mce-shadow);

  &__content {
    display: flex;
    align-items: center;
  }
}
</style>

<script lang="ts" setup>
import { computed, useTemplateRef } from 'vue'
import { makeMceOverlayProps } from '../../composables'
import Overlay from './Overlay.vue'

const props = defineProps({
  ...makeMceOverlayProps({
    location: 'right' as const,
    offset: 8,
  }),
  showArrow: Boolean,
})

const isActive = defineModel<boolean>()
const overlay = useTemplateRef('overlayTpl')

const contentClass = computed(() => {
  const [side, align = 'center'] = props.location.split('-')
  return [
    `mce-tooltip--side-${side}`,
    `mce-tooltip--align-${align}`,
  ]
})

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
    :content-class="contentClass"
    :location="props.location"
    :offset="props.offset"
    :target="props.target"
    :attach="props.attach"
  >
    <template
      v-if="$slots.activator"
      #activator="slotProps"
    >
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

    <template
      v-if="isActive"
    >
      <div v-if="showArrow" class="mce-tooltip__arrow" />

      <div class="mce-tooltip__content">
        <slot />

        <div v-if="$slots.kbd" class="mce-tooltip__kbd">
          <slot name="kbd" />
        </div>
      </div>
    </template>
  </Overlay>
</template>

<style lang="scss">
.mce-tooltip {
  $root: &;

  .mce-overlay-content {
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
  }

  &__content {
    display: flex;
    align-items: center;
  }

  &__arrow {
    position: absolute;
    width: 0;
    height: 0;
    border-style: solid;
    border-color: transparent;
    border-width: 6px;
    z-index: 15;
  }

  &--side-left #{$root}__arrow {
    right: 0;
    top: 50%;
    transform: translate(100%, -50%);
    border-right: none;
    border-left-color: rgb(var(--mce-theme-surface-variant));
  }

  &--side-left#{$root}--align-start #{$root}__arrow {
    top: 25%;
  }

  &--side-left#{$root}--align-end #{$root}__arrow {
    top: 75%;
  }

  &--side-top #{$root}__arrow {
    left: 50%;
    bottom: 0;
    transform: translate(-50%, 100%);
    border-bottom: none;
    border-top-color: rgb(var(--mce-theme-surface-variant));
  }

  &--side-top#{$root}--align-start #{$root}__arrow {
    left: 25%;
  }

  &--side-top#{$root}--align-end #{$root}__arrow {
    left: 75%;
  }

  &--side-right #{$root}__arrow {
    left: 0;
    top: 50%;
    transform: translate(-100%, -50%);
    border-left: none;
    border-right-color: rgb(var(--mce-theme-surface-variant));
  }

  &--side-right#{$root}--align-start #{$root}__arrow {
    top: 25%;
  }

  &--side-right#{$root}--align-end #{$root}__arrow {
    top: 75%;
  }

  &--side-bottom #{$root}__arrow {
    left: 50%;
    top: 0;
    transform: translate(-50%, -100%);
    border-top: none;
    border-bottom-color: rgb(var(--mce-theme-surface-variant));
  }

  &--side-bottom#{$root}--align-start #{$root}__arrow {
    left: 25%;
  }

  &--side-bottom#{$root}--align-end #{$root}__arrow {
    left: 75%;
  }

  &__kbd {
    font-size: 0.75rem;
    white-space: nowrap;
    letter-spacing: .08em;
    margin-left: 16px;
    opacity: .3;
  }
}
</style>

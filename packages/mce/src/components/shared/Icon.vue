<script setup lang="ts">
import { computed, useAttrs } from 'vue'
import { makeIconProps, useIcon } from '../../composables'

const props = defineProps({
  disabled: Boolean,
  ...makeIconProps(),
})
const attrs = useAttrs()
const { iconData } = useIcon(computed(() => props.icon))
const hasClick = !!(attrs.onClick || attrs.onClickOnce)
</script>

<template>
  <Component
    :is="iconData.component"
    :icon="iconData.icon"
    :tag="props.tag"
    class="mce-icon"
    :class="{
      'mce-icon--disabled': props.disabled,
    }"
    :role="hasClick ? 'button' : undefined"
    :aria-hidden="!hasClick"
    :tabindex="hasClick ? props.disabled ? -1 : 0 : undefined"
  />
</template>

<style lang="scss">
  .mce-icon {
    align-items: center;
    display: inline-flex;
    font-feature-settings: "liga";
    height: 1em;
    justify-content: center;
    letter-spacing: normal;
    line-height: 1;
    position: relative;
    opacity: var(--mce-icon-opacity, 1);
    text-indent: 0;
    text-align: center;
    -webkit-user-select: none;
    user-select: none;
    vertical-align: middle;
    width: 1em;
    min-width: 1em;

    &__svg {
      fill: currentColor;
      width: 100%;
      height: 100%;
    }
  }
</style>

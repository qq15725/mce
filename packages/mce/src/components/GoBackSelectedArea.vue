<script setup lang="ts">
import { computed } from 'vue'
import { useEditor } from '../composables/editor'
import { isOverlappingAabb } from '../utils'
import { Icon } from './icon'

const {
  selectionAabb,
  drawboardAabb,
  aabbToDrawboardAabb,
  t,
  exec,
} = useEditor()

const isActive = computed(() => {
  return selectionAabb.value.width
    && selectionAabb.value.height
    && !isOverlappingAabb(
      drawboardAabb.value,
      aabbToDrawboardAabb(selectionAabb.value),
    )
})
</script>

<template>
  <div
    v-if="isActive"
    class="mce-back-selected-aera"
    @click.prevent="exec('scrollToSelection', { behavior: 'smooth' })"
  >
    <Icon icon="$gps" />
    <span>{{ t('goBackSelectedArea') }}</span>
  </div>
</template>

<style lang="scss">
  .mce-back-selected-aera {
    pointer-events: auto !important;
    position: absolute;
    left: 50%;
    bottom: 24px;
    padding: 4px 8px;
    display: flex;
    align-items: center;
    gap: 4px;
    color: rgba(var(--mce-theme-surface), 1);
    background-color: rgba(var(--mce-theme-on-background), var(--mce-medium-emphasis-opacity));
    transform: translateX(-50%);
    backdrop-filter: blur(var(--mce-blur));
    border-radius: 8px;
    font-size: 0.875rem;
    cursor: pointer;
  }
</style>

<script setup lang="ts">
import { computed } from 'vue'
import { useEditor } from '../composables'
import { isOverlappingAabb } from '../utils'

const {
  currentAabb,
  drawboardAabb,
  aabbToDrawboardAabb,
  exec,
  t,
} = useEditor()

const isActive = computed(() => {
  return currentAabb.value.width
    && currentAabb.value.height
    && !isOverlappingAabb(
      drawboardAabb.value,
      aabbToDrawboardAabb(currentAabb.value),
    )
})
</script>

<template>
  <div
    v-if="isActive"
    class="mce-back-selected-aera"
    @click.prevent="exec('zoomToSelection')"
  >
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 256 256"><path fill="currentColor" d="M232 120h-8.34A96.14 96.14 0 0 0 136 32.34V24a8 8 0 0 0-16 0v8.34A96.14 96.14 0 0 0 32.34 120H24a8 8 0 0 0 0 16h8.34A96.14 96.14 0 0 0 120 223.66V232a8 8 0 0 0 16 0v-8.34A96.14 96.14 0 0 0 223.66 136H232a8 8 0 0 0 0-16m-96 87.6V200a8 8 0 0 0-16 0v7.6A80.15 80.15 0 0 1 48.4 136H56a8 8 0 0 0 0-16h-7.6A80.15 80.15 0 0 1 120 48.4V56a8 8 0 0 0 16 0v-7.6a80.15 80.15 0 0 1 71.6 71.6H200a8 8 0 0 0 0 16h7.6a80.15 80.15 0 0 1-71.6 71.6M128 88a40 40 0 1 0 40 40a40 40 0 0 0-40-40m0 64a24 24 0 1 1 24-24a24 24 0 0 1-24 24" /></svg>
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
    background-color: rgba(var(--mce-theme-on-background), .3);
    transform: translateX(-50%);
    border-radius: 8px;
    font-size: 14px;
    cursor: pointer;
  }
</style>

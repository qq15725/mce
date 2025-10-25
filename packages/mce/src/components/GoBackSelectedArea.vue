<script setup lang="ts">
import { computed } from 'vue'
import { useEditor } from '../composables'
import { isOverlappingAabb } from '../utils'
import Icon from './shared/Icon.vue'

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
    background-color: rgba(var(--mce-theme-on-background), .3);
    transform: translateX(-50%);
    border-radius: 8px;
    font-size: 14px;
    cursor: pointer;
  }
</style>

<script setup lang="ts">
import type { Element2D } from 'modern-canvas'

defineProps<{
  node: Element2D
}>()
</script>

<template>
  <div
    class="mce-trackhead"
    :style="{
      height: `var(--timeline-track-height__${node.meta.inEditorIs}, 22px)`,
    }"
  >
    {{ node.meta.inEditorIs }}
  </div>
</template>

<style lang="scss">
  .mce-trackhead {
    display: flex;
    margin-bottom: 8px;
    height: 22px;
    min-height: 22px;
    align-items: center;
    justify-content: center;
    color: rgba(var(--mce-theme-on-surface), .6);
    font-size: 12px;
    width: 100%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>

<script setup lang="ts">
import type { Node } from 'modern-canvas'

defineProps<{
  node: Node
}>()
</script>

<template>
  <div
    class="m-trackhead"
    :style="{
      height: `var(--timeline-track-height__${node.meta.inEditorIs}, 22px)`,
    }"
  >
    {{ node.meta.inEditorIs }}
  </div>
</template>

<style lang="scss">
  .m-trackhead {
    display: flex;
    height: 22px;
    min-height: 22px;
    align-items: center;
    color: rgba(var(--m-theme-on-surface), .6);
    font-size: 0.75rem;
    width: 100%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>

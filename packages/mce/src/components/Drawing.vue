<script setup lang="ts">
import { useEditor } from '../composables/editor'

const {
  drawboardPointer,
  state,
  activeDrawingTool,
  t,
} = useEditor()
</script>

<template>
  <div
    v-if="state === 'drawing' && drawboardPointer"
    class="mce-drawing"
    :style="{
      left: `${drawboardPointer.x}px`,
      top: `${drawboardPointer.y}px`,
    }"
  >
    <div v-if="activeDrawingTool?.name" class="mce-drawing__tip">
      {{ t(activeDrawingTool.name) }}
    </div>
  </div>
</template>

<style lang="scss">
.mce-drawing {
  position: absolute;

  &__tip {
    margin: 4px;
    border: 1px solid #0000002b;
    border-radius: 4px;
    width: fit-content;
    height: 22px;
    padding: 0 4px;
    font-size: 0.875rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    background-color: rgba(var(--mce-theme-surface), 1);
  }
}
</style>

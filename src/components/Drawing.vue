<script setup lang="ts">
import { useMouse } from '@vueuse/core'
import { useEditor } from '../composables/editor'

const {
  state,
  stateContext,
  t,
  camera,
  drawboardAabb,
  setCursor,
} = useEditor()

const { x, y } = useMouse()

function onMousedown(e: MouseEvent) {
  const pos = camera.value.toGlobal({
    x: e.clientX - drawboardAabb.value.left,
    y: e.clientY - drawboardAabb.value.top,
  })
  stateContext.value?.callback?.(pos)
  setCursor(undefined)
}
</script>

<template>
  <div
    v-if="state === 'drawing'"
    class="mce-drawing"
    :style="{
      left: `${x}px`,
      top: `${y}px`,
    }"
    @mousedown="onMousedown"
  >
    <div v-if="stateContext?.content" class="mce-drawing__content">
      {{ t(stateContext.content) }}
    </div>
  </div>
</template>

<style lang="scss">
.mce-drawing {
  pointer-events: auto !important;
  position: fixed;

  &__content {
    margin: 4px;
    border: 1px solid #0000002b;
    border-radius: 4px;
    width: fit-content;
    height: 22px;
    padding: 0 4px;
    font-size: 14px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    background-color: rgba(var(--mce-theme-surface), 1);
  }
}
</style>

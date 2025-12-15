<script setup lang="ts">
import { computed } from 'vue'
import { useEditor } from '../composables/editor'

const {
  selection,
  hoverElement,
  getObb,
  camera,
} = useEditor()

const hoverElementObb = computed(() => getObb(hoverElement.value, 'drawboard'))
</script>

<template>
  <div
    v-if="hoverElement && !hoverElement.equal(selection[0])"
    class="mce-hover"
    :data-name="hoverElement.name"
    :style="{
      borderColor: 'currentcolor',
      borderRadius: `${(hoverElement.style.borderRadius ?? 0) * camera.zoom.x}px`,
      ...hoverElementObb.toCssStyle(),
    }"
  />
</template>

<style lang="scss">
.mce-hover {
  position: absolute;
  border-style: solid;
  border-width: 2px;
  color: rgba(var(--mce-theme-primary), 1);
}
</style>

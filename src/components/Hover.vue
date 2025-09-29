<script setup lang="ts">
import { computed } from 'vue'
import { useEditor } from '../composables/editor'
import { boundingBoxToStyle } from '../utils/box'

const {
  activeElement,
  hoverElement,
  getObbInDrawboard,
} = useEditor()

const hoverElementObb = computed(() => getObbInDrawboard(hoverElement.value))
</script>

<template>
  <div
    v-if="hoverElement && !hoverElement.equal(activeElement)"
    class="mce-hover"
    data-title="悬停元素盒"
    :data-name="hoverElement.name"
    :style="{
      borderColor: 'currentcolor',
      ...boundingBoxToStyle(hoverElementObb),
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

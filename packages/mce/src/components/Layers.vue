<script setup lang="ts">
import type { Node } from 'modern-canvas'
import { nextTick, ref, watch } from 'vue'
import { createLayer } from '../composables'
import { useEditor } from '../composables/editor'
import Layer from './Layer.vue'

const {
  root,
  selection,
  state,
} = useEditor()

const rootDom = ref<HTMLElement>()

const {
  selecting,
  openedItems,
  domItems,
} = createLayer()

watch(selection, (selection) => {
  if (state.value === 'selecting' || selecting.value) {
    return
  }
  let last: Node | undefined
  selection.forEach((node) => {
    node.findAncestor((ancestor) => {
      const opened = openedItems.get(ancestor.id)
      if (opened) {
        opened.value = true
      }
      return false
    })
    last = node
  })
  if (last) {
    nextTick().then(() => {
      domItems.get(last!.id)?.value?.scrollIntoView({
        block: 'center',
      })
    })
  }
})
</script>

<template>
  <div
    ref="rootDom"
    class="mce-layers"
  >
    <Layer
      v-for="(child, index) in root.children" :key="index"
      :node="child"
    />
  </div>
</template>

<style lang="scss">
  .mce-layers {
    position: relative;
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    min-width: auto;
    padding: 8px;
    overflow: auto;
    background-color: rgb(var(--mce-theme-surface));

    .mce-layer__expand {
      opacity: 0;
    }

    &:hover {
      .mce-layer__expand {
        opacity: 1;
      }
    }
  }
</style>

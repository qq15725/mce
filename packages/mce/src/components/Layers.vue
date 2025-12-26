<script setup lang="ts">
import type { Node } from 'modern-canvas'
import { computed, nextTick, watch } from 'vue'
import { createLayer } from '../composables'
import { useEditor } from '../composables/editor'
import Layer from './Layer.vue'

const {
  root,
  selection,
  state,
  nodeIndexMap,
} = useEditor()

const sortedSelection = computed(() => {
  return selection.value
    .map((node) => {
      return {
        node,
        index: nodeIndexMap.get(node.id) ?? 0,
      }
    })
    .sort((a, b) => a.index - b.index)
    .map(v => v.node)
})

const {
  selecting,
  openedItems,
  domItems,
  getIdByNode,
} = createLayer({
  sortedSelection,
})

watch(selection, (selection) => {
  if (state.value === 'selecting' || selecting.value) {
    return
  }
  let last: Node | undefined
  selection.forEach((node) => {
    node.findAncestor((ancestor) => {
      const opened = openedItems.get(getIdByNode(ancestor) ?? '')
      if (opened) {
        opened.value = true
      }
      return false
    })
    last = node
  })
  if (last) {
    nextTick().then(() => {
      domItems.get(getIdByNode(last!) ?? '')?.value?.scrollIntoView({
        inline: 'nearest',
        block: 'center',
      })
    })
  }
})
</script>

<template>
  <div class="mce-layers">
    <div class="mce-layers__wrapper">
      <Layer
        :root="true"
        :node="root"
        :opened="true"
      />
    </div>
  </div>
</template>

<style lang="scss">
  .mce-layers {
    position: relative;
    width: 100%;
    height: 100%;
    min-width: auto;
    overflow: auto;
    background-color: rgb(var(--mce-theme-surface));

    &__wrapper {
      padding: 8px;
      width: max-content;
      min-width: 100%;
    }

    .mce-layer__prepend {
      opacity: 0;
    }

    .mce-layer--root:hover {
      .mce-layer__prepend {
        opacity: 1;
      }
    }

    &:hover .mce-layer:not(.mce-layer--root) {
      .mce-layer__prepend {
        opacity: 1;
      }
    }
  }
</style>

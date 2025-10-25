<script setup lang="ts">
import type { TimelineNode } from 'modern-canvas'
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  node: TimelineNode
  zoom?: number
  active?: boolean
}>(), {
  zoom: 1,
})

const style = computed(() => {
  const box: Record<string, any> = { left: 0, top: 0, width: 0, height: 0 }

  box.left = props.node.delay * props.zoom
  box.width = props.node.duration * props.zoom

  if (box.width) {
    box.width = `${box.width}px`
  }
  else {
    box.width = '100%'
  }

  return {
    width: box.width,
    transform: `matrix(1, 0, 0, 1, ${box.left}, ${box.top})`,
  }
})
</script>

<template>
  <div
    class="mce-segment"
    :class="[
      `mce-segment--${node.meta.inEditorIs}`,
      active && `mce-segment--active`,
    ]"
    :style="style"
  >
    <div v-if="active" class="mce-segment__edge mce-segment__edge--front" />

    <span class="mce-segment__node" style="overflow: hidden;">{{ props.node.name }}</span>

    <div v-if="active" class="mce-segment__edge mce-segment__edge--end" />
  </div>
</template>

<style lang="scss">
  .mce-segment {
    display: flex;
    font-size: 12px;
    align-items: center;
    position: absolute;
    top: 2px;
    height: calc(100% - 4px);
    user-select: none;
    flex-wrap: nowrap;
    color: white;
    border-radius: 2px;
    background-color: #cc9641;

    &--active {
      outline: 1px solid rgb(var(--mce-theme-on-surface));
    }

    &__animation {
      position: absolute;
      bottom: 2px;

      &--in {
        width: 0;
        left: 4px;
        background-color: white;
        height: 2px;
        &:after {
          border-color: transparent transparent transparent white;
          border-style: solid;
          border-width: 5px 0 0 6px;
          bottom: 0;
          content: "";
          display: block;
          height: 0;
          left: 100%;
          position: absolute;
          width: 0;
        }
      }

      &--out {
        width: 0;
        right: 4px;
        background-color: white;
        height: 2px;

        &:before {
          border-color: transparent white transparent transparent;
          border-style: solid;
          border-width: 5px 6px 0 0;
          bottom: 0;
          content: "";
          display: block;
          height: 0;
          position: absolute;
          right: 100%;
          width: 0;
        }
      }

      &--stay {
        left: 0;
        background-color: white;
        height: 2px;

        &:before {
          border-color: transparent white transparent transparent;
          border-style: solid;
          border-width: 5px 6px 0 0;
          bottom: 0;
          content: "";
          display: block;
          height: 0;
          position: absolute;
          right: 100%;
          width: 0;
        }

        &:after {
          border-color: transparent transparent transparent white;
          border-style: solid;
          border-width: 5px 0 0 6px;
          bottom: 0;
          content: "";
          display: block;
          height: 0;
          left: 100%;
          position: absolute;
          width: 0;
        }
      }
    }

    &__edge {
      align-items: center;
      background-color: rgb(var(--mce-theme-on-surface));
      bottom: 0;
      content: "";
      display: flex;
      justify-content: center;
      pointer-events: auto;
      position: absolute;
      top: 0;
      width: 4px;
      cursor: col-resize;

      &:before {
        background-color: rgb(var(--mce-theme-surface));
        content: "";
        display: block;
        height: 10px;
        width: 2px;
      }

      &--front {
        border-bottom-left-radius: 2px;
        border-top-left-radius: 2px;
        left: 0;
      }

      &--end {
        border-bottom-right-radius: 2px;
        border-top-right-radius: 2px;
        right: 0;
      }
    }

    &__node {
      border-radius: 2px;
      padding: 2px 8px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
</style>

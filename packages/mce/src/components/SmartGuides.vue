<script setup lang="ts">
import { useEditor } from '../composables/editor'

const { snapLines } = useEditor()
</script>

<template>
  <div class="mce-smart-guides">
    <div
      v-for="(item, key) in snapLines"
      :key="key"
      :class="item.class.map((v: string) => `mce-smart-guides__${v}`)"
      :style="{
        left: `${item.style.left}px`,
        top: `${item.style.top}px`,
        width: `${item.style.width}px`,
        height: `${item.style.height}px`,
      }"
    />
  </div>
</template>

<style lang="scss">
  .mce-smart-guides {
    position: absolute;
    overflow: hidden;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;

    &__alignment {
      position: absolute;
      background-color: #FF4AFF;
      height: 1px;
      width: 1px;
    }

    &__area {
      position: absolute;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: rgba(244, 36, 253, .2);

      &:before {
        content: '';
        background: #1690ff;
        height: 1px;
        width: 100%;
      }

      &:after {
        position: absolute;
        content: '';
        height: 5px;
        width: 100%;
        border-left: 1px solid #1690ff;
        border-right: 1px solid #1690ff;
      }

      &--vertical:before {
        height: 100%;
        width: 1px;
      }

      &--vertical:after {
        height: 100%;
        width: 5px;
        border-left: none;
        border-right: none;
        border-top: 1px solid #1690ff;
        border-bottom: 1px solid #1690ff;
      }
    }
  }
</style>

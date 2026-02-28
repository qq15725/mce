<script setup lang="ts">
import { useEditor } from '../composables'

defineProps<{
  snapLines?: Record<string, any>[]
}>()

const {
  state,
} = useEditor()
</script>

<template>
  <div
    v-if="state === 'transforming' || state === 'moving'"
    class="m-smart-guides"
  >
    <template
      v-for="(item, key) in snapLines" :key="key"
    >
      <div
        :class="item.class.map((v: string) => `m-smart-guides__${v}`)"
        :style="{
          left: `${item.style.left}px`,
          top: `${item.style.top}px`,
          width: `${item.style.width}px`,
          height: `${item.style.height}px`,
        }"
      />
    </template>
  </div>
</template>

<style lang="scss">
  .m-smart-guides {
    position: absolute;
    overflow: hidden;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;

    &__alignment {
      position: absolute;
      background-color: rgb(var(--m-theme-secondary));
      height: 1px;
      width: 1px;
    }

    &__area {
      position: absolute;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: rgba(var(--m-theme-secondary), .2);

      &:before {
        content: '';
        background: rgb(var(--m-theme-primary));
        height: 1px;
        width: 100%;
      }

      &:after {
        position: absolute;
        content: '';
        height: 5px;
        width: 100%;
        border-left: 1px solid rgb(var(--m-theme-primary));
        border-right: 1px solid rgb(var(--m-theme-primary));
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
        border-top: 1px solid rgb(var(--m-theme-primary));
        border-bottom: 1px solid rgb(var(--m-theme-primary));
      }
    }
  }
</style>

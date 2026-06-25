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
      >
        <span v-if="item.label" class="m-smart-guides__label">{{ item.label }}</span>
      </div>
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

    // 间距辅助虚线：标示距离线量到的目标边，同色低透明度，repeating-gradient 画虚线。
    &__dashed {
      position: absolute;
      background-image: repeating-linear-gradient(
        to right,
        rgba(var(--m-theme-secondary), .6) 0 4px,
        transparent 4px 7px
      );
    }

    &__dashed--vertical {
      background-image: repeating-linear-gradient(
        to bottom,
        rgba(var(--m-theme-secondary), .6) 0 4px,
        transparent 4px 7px
      );
    }

    &__distance {
      position: absolute;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: rgb(var(--m-theme-primary));

      // 两端把手：垂直于线方向的小帽。水平线 → 左右竖帽；竖直线(--vertical) → 上下横帽。
      // inset 简写(top right bottom left)一并复位四向偏移，避免横/竖样式互相残留。
      &::before,
      &::after {
        content: '';
        position: absolute;
        background-color: rgb(var(--m-theme-primary));
      }

      &::before {
        inset: 50% auto auto 0;
        width: 1px;
        height: 8px;
        transform: translateY(-50%);
      }

      &::after {
        inset: 50% 0 auto auto;
        width: 1px;
        height: 8px;
        transform: translateY(-50%);
      }

      &--vertical::before {
        inset: 0 auto auto 50%;
        width: 8px;
        height: 1px;
        transform: translateX(-50%);
      }

      &--vertical::after {
        inset: auto auto 0 50%;
        width: 8px;
        height: 1px;
        transform: translateX(-50%);
      }
    }

    // 数字标签锚定在容器中心（即间距线所在处，间距块的线也在其中心），再整体移到
    // 线的上方（水平），不压住线、也不会跑到间距块的顶部。
    &__label {
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, calc(-100% - 3px));
      padding: 1px 5px;
      border-radius: 8px;
      font-size: 10px;
      font-weight: 600;
      line-height: 1.4;
      white-space: nowrap;
      color: rgb(var(--m-theme-on-primary));
      background-color: rgb(var(--m-theme-primary));
      pointer-events: none;
    }

    // 竖直的距离/间距线：数字改放在线的左侧。
    &__distance--vertical > &__label,
    &__area--vertical > &__label {
      transform: translate(calc(-100% - 3px), -50%);
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

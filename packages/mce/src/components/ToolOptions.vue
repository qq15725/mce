<script setup lang="ts">
import { useEditor } from '../composables/editor'

// 直线 / 箭头 / 画笔工具激活时的选项面板：选线宽 + 颜色，写入共享的 drawStyle 配置。
const { getConfigRef } = useEditor()
const style = getConfigRef<Mce.DrawStyleConfig>('interaction.drawStyle')

const WIDTHS = [3, 6, 10]
const COLORS = ['#1677ff', '#52c41a', '#faad14', '#1a1a1a', '#ffffff', '#ff4d4f']

// 圆点直径按线宽放大，直观区分细/中/粗。
function dotSize(w: number): number {
  return 4 + w
}

function setWidth(w: number): void {
  style.value = { ...style.value, width: w }
}
function setColor(c: string): void {
  style.value = { ...style.value, color: c }
}
</script>

<template>
  <div class="m-tool-options">
    <button
      v-for="w in WIDTHS"
      :key="`w${w}`"
      class="m-tool-options__width"
      :class="{ 'm-tool-options__width--active': style.width === w }"
      @click="setWidth(w)"
    >
      <span
        class="m-tool-options__dot"
        :style="{ width: `${dotSize(w)}px`, height: `${dotSize(w)}px` }"
      />
    </button>

    <span class="m-tool-options__divider" />

    <button
      v-for="c in COLORS"
      :key="c"
      class="m-tool-options__color"
      :class="{ 'm-tool-options__color--active': style.color === c }"
      :style="{ background: c }"
      @click="setColor(c)"
    />
  </div>
</template>

<style lang="scss">
  .m-tool-options {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px 8px;
    background: rgb(var(--m-theme-surface));
    border: 1px solid rgba(var(--m-theme-on-surface), .08);
    border-radius: 12px;
    box-shadow: 0 6px 20px rgba(0, 0, 0, .16), 0 1px 3px rgba(0, 0, 0, .08);

    &__width {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 26px;
      height: 26px;
      border: none;
      border-radius: 8px;
      background: transparent;
      cursor: pointer;

      &:hover {
        background: rgba(var(--m-theme-on-surface), .06);
      }

      &--active {
        background: rgba(var(--m-theme-primary), .14);
      }
    }

    &__dot {
      border-radius: 50%;
      background: rgba(var(--m-theme-on-surface), .8);
    }

    &__divider {
      width: 1px;
      height: 20px;
      margin: 0 2px;
      background: rgba(var(--m-theme-on-surface), .12);
    }

    &__color {
      width: 22px;
      height: 22px;
      padding: 0;
      border: 1px solid rgba(var(--m-theme-on-surface), .15);
      border-radius: 6px;
      cursor: pointer;

      &--active {
        box-shadow: 0 0 0 2px rgb(var(--m-theme-surface)), 0 0 0 4px rgba(var(--m-theme-primary), 1);
      }
    }
  }
</style>

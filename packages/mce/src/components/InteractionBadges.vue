<script setup lang="ts">
import type { Element2D, Node } from 'modern-canvas'
import { computed } from 'vue'
import { useEditor } from '../composables/editor'
import { Icon } from './icon'

// 编辑态在「有交互」的元素左上角显示一个闪电角标，提升可发现性。
// 预览态不显示（避免遮挡交互）。
const { root, isElement, getObb, previewMode, interactionsRev, exec } = useEditor()

const items = computed(() => {
  void interactionsRev.value
  const out: Element2D[] = []
  root.value?.findOne((n: Node) => {
    if (isElement(n) && exec('getElementInteractions', n as Element2D).length)
      out.push(n as Element2D)
    return false
  })
  return out
})

function badgeStyle(el: Element2D) {
  const css = getObb(el, 'drawboard').toCssStyle() as Record<string, string>
  return { left: css.left, top: css.top }
}
</script>

<template>
  <div v-if="!previewMode" class="m-itx-badges">
    <div
      v-for="el in items"
      :key="el.id"
      class="m-itx-badge"
      :style="badgeStyle(el)"
    >
      <Icon icon="$gps" />
    </div>
  </div>
</template>

<style lang="scss">
  .m-itx-badges {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .m-itx-badge {
    position: absolute;
    transform: translate(-50%, -50%);
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: rgb(var(--m-theme-primary));
    color: rgb(var(--m-theme-on-primary, 255, 255, 255));
    font-size: 0.65rem;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25);
  }
</style>

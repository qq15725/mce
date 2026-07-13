<script setup lang="ts">
import type { PenAnchor, PenDraft } from '../plugins/pen'
import { computed } from 'vue'
import { useEditor } from '../composables'

// 钢笔绘制态的可视辅助（Figma 风格）：已落锚点方块、曲线点的控制柄（线 + 端点圆）、
// 光标到最后锚点的橡皮筋预览段、以及靠近起点时的闭合高亮圈。数据由 pen 插件按世界坐标
// 喂入，这里用 camera 映射到屏幕像素，SVG 元素用固定像素尺寸（不随缩放变大）。
const props = defineProps<{
  draft?: PenDraft
}>()

const { camera } = useEditor()

function toScreen(x: number, y: number): { x: number, y: number } {
  const { zoom, position } = camera.value
  return { x: x * zoom.x - position.x, y: y * zoom.y - position.y }
}

const anchors = computed(() => {
  if (!props.draft) {
    return []
  }
  return props.draft.anchors.map((a, i) => {
    const s = toScreen(a.x, a.y)
    return { ...s, first: i === 0 }
  })
})

// 控制柄：每个曲线锚点的入向柄 / 出向柄（退化到锚点自身的不画）。
const handles = computed(() => {
  if (!props.draft) {
    return []
  }
  const list: { ax: number, ay: number, hx: number, hy: number }[] = []
  for (const a of props.draft.anchors) {
    if (!a.curved) {
      continue
    }
    const anchor = toScreen(a.x, a.y)
    for (const [hx, hy] of [[a.ix, a.iy], [a.ox, a.oy]] as const) {
      if (hx === a.x && hy === a.y) {
        continue
      }
      const h = toScreen(hx, hy)
      list.push({ ax: anchor.x, ay: anchor.y, hx: h.x, hy: h.y })
    }
  }
  return list
})

// 橡皮筋预览：从最后一个锚点到光标。最后锚点带出向柄则画贝塞尔，否则直线。闭合 / 无光标时不画。
const rubber = computed<string | null>(() => {
  const d = props.draft
  if (!d || d.closed || !d.cursor || !d.anchors.length) {
    return null
  }
  const last: PenAnchor = d.anchors[d.anchors.length - 1]
  const a = toScreen(last.x, last.y)
  const c = toScreen(d.cursor.x, d.cursor.y)
  if (last.curved) {
    const o = toScreen(last.ox, last.oy)
    return `M ${a.x} ${a.y} C ${o.x} ${o.y} ${c.x} ${c.y} ${c.x} ${c.y}`
  }
  return `M ${a.x} ${a.y} L ${c.x} ${c.y}`
})

const closeHover = computed(() => props.draft?.closeHover ?? false)
</script>

<template>
  <svg
    v-if="props.draft"
    class="m-pen-draft"
    :style="{ overflow: 'visible' }"
  >
    <path
      v-if="rubber"
      class="m-pen-draft__rubber"
      :d="rubber"
    />
    <line
      v-for="(h, i) in handles"
      :key="`hl${i}`"
      class="m-pen-draft__handle-line"
      :x1="h.ax" :y1="h.ay" :x2="h.hx" :y2="h.hy"
    />
    <circle
      v-for="(h, i) in handles"
      :key="`hc${i}`"
      class="m-pen-draft__handle"
      :cx="h.hx" :cy="h.hy" r="3.5"
    />
    <rect
      v-for="(a, i) in anchors"
      :key="`a${i}`"
      class="m-pen-draft__anchor"
      :x="a.x - 4" :y="a.y - 4" width="8" height="8"
    />
    <circle
      v-if="closeHover && anchors[0]"
      class="m-pen-draft__close"
      :cx="anchors[0].x" :cy="anchors[0].y" r="7"
    />
  </svg>
</template>

<style lang="scss">
.m-pen-draft {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  color: rgb(var(--m-theme-primary));

  &__rubber {
    fill: none;
    stroke: currentColor;
    stroke-width: 1;
    opacity: 0.7;
  }

  &__handle-line {
    stroke: currentColor;
    stroke-width: 1;
    opacity: 0.6;
  }

  &__handle {
    fill: currentColor;
    stroke: #fff;
    stroke-width: 1;
  }

  &__anchor {
    fill: #fff;
    stroke: currentColor;
    stroke-width: 1.5;
  }

  &__close {
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
  }
}
</style>

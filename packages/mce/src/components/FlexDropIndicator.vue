<script setup lang="ts">
import { computed } from 'vue'
import { useEditor } from '../composables'

// 拖拽进入 / 内排 auto-layout(flex)画板时,在被拖元素的流式槽位处画一条主轴方向的蓝色
// 插入指示线(Figma 风格)。槽位由 flexLayout 拖拽逻辑算好(世界坐标)后经 props 传入,拖拽
// 结束清空 → 隐藏。用 SVG + cameraTransform 画世界坐标线,vector-effect 让线宽不随缩放变化。
const props = defineProps<{
  slot?: { horizontal: boolean, main: number, crossStart: number, crossEnd: number }
}>()

const { camera } = useEditor()

const cameraTransform = computed(() => {
  const { zoom, position } = camera.value
  return `translate(${-position.x} ${-position.y}) scale(${zoom.x} ${zoom.y})`
})

const path = computed<string | null>(() => {
  const s = props.slot
  if (!s)
    return null
  // horizontal(row):竖线;vertical(column):横线。
  return s.horizontal
    ? `M ${s.main} ${s.crossStart} L ${s.main} ${s.crossEnd}`
    : `M ${s.crossStart} ${s.main} L ${s.crossEnd} ${s.main}`
})
</script>

<template>
  <svg
    v-if="path"
    class="m-flex-drop"
    :style="{ overflow: 'visible' }"
  >
    <path
      class="m-flex-drop__line"
      :d="path"
      :transform="cameraTransform"
      vector-effect="non-scaling-stroke"
    />
  </svg>
</template>

<style lang="scss">
.m-flex-drop {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;

  &__line {
    fill: none;
    stroke: rgb(var(--m-theme-primary));
    stroke-width: 2;
    stroke-linecap: round;
  }
}
</style>

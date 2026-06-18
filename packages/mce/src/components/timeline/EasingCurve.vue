<script setup lang="ts">
import type { EasingCoords } from '../../utils'
import { ref, useTemplateRef } from 'vue'

// 可拖手柄的 cubic-bezier 曲线编辑器（Jitter / Framer 风格）。
// CSS easing 就是一条从 (0,0) 到 (1,1) 的三次贝塞尔，控制点 P1=(x1,y1)、P2=(x2,y2)
// 直接对应 SVG path 的控制点，所以无需采样即可精确绘制。
const props = defineProps<{
  modelValue: EasingCoords
}>()

const emit = defineEmits<{
  'update:modelValue': [coords: EasingCoords]
}>()

// 内部绘图区尺寸；上下留白允许 y 超出 [0,1]（overshoot / 回弹）。
const W = 200
const H = 96
const PADX = 8
const PADY = 28
const svgW = W + PADX * 2
const svgH = H + PADY * 2

const svgRef = useTemplateRef<SVGSVGElement>('svgTpl')
const dragging = ref<0 | 1 | 2>(0)

function sx(bx: number): number {
  return PADX + bx * W
}
function sy(by: number): number {
  return PADY + (1 - by) * H
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v))
}
function round(v: number): number {
  return Math.round(v * 100) / 100
}

// 数值输入：x 夹在 [0,1]（CSS 约束），y 允许越界（overshoot）。
function setCoord(index: number, raw: string) {
  const v = Number(raw)
  if (!Number.isFinite(v))
    return
  const next = [...props.modelValue] as EasingCoords
  next[index] = index === 0 || index === 2 ? clamp(round(v), 0, 1) : round(v)
  emit('update:modelValue', next)
}

function startDrag(e: MouseEvent, handle: 1 | 2) {
  e.preventDefault()
  e.stopPropagation()
  dragging.value = handle
  const rect = svgRef.value!.getBoundingClientRect()

  function onMove(ev: MouseEvent) {
    const bx = clamp((ev.clientX - rect.left - PADX) / W, 0, 1)
    const by = clamp(1 - (ev.clientY - rect.top - PADY) / H, -0.5, 1.5)
    const [x1, y1, x2, y2] = props.modelValue
    const next: EasingCoords = handle === 1
      ? [round(bx), round(by), x2, y2]
      : [x1, y1, round(bx), round(by)]
    emit('update:modelValue', next)
  }
  function onUp() {
    dragging.value = 0
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
  }
  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
}
</script>

<template>
  <div class="m-ease-wrap">
    <svg
      ref="svgTpl"
      class="m-ease"
      :viewBox="`0 0 ${svgW} ${svgH}`"
      :width="svgW"
      :height="svgH"
    >
      <!-- 单位方格 [0,1]×[0,1] -->
      <rect
        class="m-ease__box"
        :x="sx(0)"
        :y="sy(1)"
        :width="W"
        :height="H"
      />
      <!-- linear 参考对角线 -->
      <line
        class="m-ease__diag"
        :x1="sx(0)"
        :y1="sy(0)"
        :x2="sx(1)"
        :y2="sy(1)"
      />
      <!-- 控制点切线 -->
      <line
        class="m-ease__tangent"
        :x1="sx(0)"
        :y1="sy(0)"
        :x2="sx(modelValue[0])"
        :y2="sy(modelValue[1])"
      />
      <line
        class="m-ease__tangent"
        :x1="sx(1)"
        :y1="sy(1)"
        :x2="sx(modelValue[2])"
        :y2="sy(modelValue[3])"
      />
      <!-- 曲线 -->
      <path
        class="m-ease__curve"
        :d="`M ${sx(0)},${sy(0)} C ${sx(modelValue[0])},${sy(modelValue[1])} ${sx(modelValue[2])},${sy(modelValue[3])} ${sx(1)},${sy(1)}`"
      />
      <!-- 两端固定点 -->
      <circle class="m-ease__anchor" :cx="sx(0)" :cy="sy(0)" r="2.5" />
      <circle class="m-ease__anchor" :cx="sx(1)" :cy="sy(1)" r="2.5" />
      <!-- 可拖手柄 -->
      <circle
        class="m-ease__handle"
        :class="{ 'm-ease__handle--active': dragging === 1 }"
        :cx="sx(modelValue[0])"
        :cy="sy(modelValue[1])"
        r="5"
        @mousedown="startDrag($event, 1)"
      />
      <circle
        class="m-ease__handle"
        :class="{ 'm-ease__handle--active': dragging === 2 }"
        :cx="sx(modelValue[2])"
        :cy="sy(modelValue[3])"
        r="5"
        @mousedown="startDrag($event, 2)"
      />
    </svg>

    <div class="m-ease__fields">
      <input
        v-for="(label, i) in ['x1', 'y1', 'x2', 'y2']"
        :key="label"
        class="m-ease__field"
        type="number"
        step="0.01"
        :title="label"
        :value="modelValue[i]"
        @change="setCoord(i, ($event.target as HTMLInputElement).value)"
      >
    </div>
  </div>
</template>

<style lang="scss">
  .m-ease-wrap {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .m-ease__fields {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 4px;
  }

  .m-ease__field {
    width: 100%;
    height: 22px;
    padding: 0 4px;
    border: 1px solid rgba(var(--m-border-color), var(--m-border-opacity));
    border-radius: 4px;
    background: transparent;
    color: inherit;
    font: inherit;
    font-variant-numeric: tabular-nums;
    text-align: center;

    &:focus {
      outline: none;
      border-color: rgb(var(--m-theme-on-surface));
    }
  }

  .m-ease {
    display: block;
    margin: 0 auto;
    touch-action: none;

    &__box {
      fill: rgba(var(--m-theme-on-surface), 0.04);
      stroke: rgba(var(--m-border-color), var(--m-border-opacity));
      stroke-width: 1;
    }

    &__diag {
      stroke: rgba(var(--m-theme-on-surface), 0.15);
      stroke-width: 1;
      stroke-dasharray: 3 3;
    }

    &__tangent {
      stroke: rgba(var(--m-theme-on-surface), 0.35);
      stroke-width: 1;
    }

    &__curve {
      fill: none;
      stroke: #cc9641;
      stroke-width: 2;
    }

    &__anchor {
      fill: rgba(var(--m-theme-on-surface), 0.5);
    }

    &__handle {
      fill: rgb(var(--m-theme-surface));
      stroke: rgb(var(--m-theme-on-surface));
      stroke-width: 1.5;
      cursor: grab;

      &:hover,
      &--active {
        fill: #cc9641;
        cursor: grabbing;
      }
    }
  }
</style>

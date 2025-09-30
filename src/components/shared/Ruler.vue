<script setup lang="ts">
import type { AxisAlignedBoundingBox } from '../../types'
import { vResizeObserver } from '@vueuse/components'
import { useDebounceFn } from '@vueuse/core'
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue'
import Tooltip from './Tooltip.vue'

const props = withDefaults(
  defineProps<{
    size?: number
    vertical?: boolean
    zoom?: number
    offset?: number
    color?: string
    aabb?: AxisAlignedBoundingBox
    pixelRatio?: number
  }>(),
  {
    size: 20,
    zoom: 1,
    offset: 0,
    color: '#aaa6',
    pixelRatio: window.devicePixelRatio || 1,
  },
)

const pixelRatio = computed(() => props.pixelRatio)
const tipText = ref<string>()
const tipPos = ref({ x: 0, y: 0 })
const canvas = useTemplateRef('canvasTpl')
const offscreenCanvas = 'OffscreenCanvas' in window
  ? new OffscreenCanvas(props.size, props.size)
  : document.createElement('canvas')
const ctx = offscreenCanvas.getContext('2d') as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D
const bbox = ref<AxisAlignedBoundingBox>()

function drawAabb() {
  if (!props.aabb?.width || !props.aabb?.height)
    return
  ctx.fillStyle = '#6165FD20'
  const offset = props.vertical ? props.aabb.top : props.aabb.left
  const length = props.vertical ? props.aabb.height : props.aabb.width
  ctx.fillRect(offset, 0, length, props.size)
}

function drawAxis(offset: [number, number], length: number, size: number, color: string) {
  ctx.lineWidth = size
  ctx.strokeStyle = color
  ctx.beginPath()
  ctx.moveTo(offset[0], offset[1])
  ctx.lineTo(offset[0] + length, offset[1])
  ctx.stroke()
}

function drawTick(tick: number, len: number, direction = 1) {
  const x1 = tick
  const y1 = props.size
  const x2 = tick
  const y2 = props.size - len * direction
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
}

function drawText(content: string, tick: number, top: number, size: number, color: string) {
  ctx.fillStyle = color
  ctx.font = `${size}px sans-serif`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'bottom'
  const x2 = tick
  const y2 = props.size - top
  ctx.save()
  if (props.vertical) {
    ctx.translate(0, props.size)
    ctx.scale(1, -1)
  }
  ctx.fillText(content, x2, y2)
  ctx.restore()
}

const unit = computed(() => {
  const baseUnit = 5
  let idealUnit = baseUnit / props.zoom
  idealUnit = Math.min(Math.max(idealUnit, 1), 100)
  const exponent = Math.floor(Math.log10(idealUnit))
  const fraction = idealUnit / 10 ** exponent
  let niceFraction = 10
  if (fraction <= 1) {
    niceFraction = 1
  }
  else if (fraction <= 2) {
    niceFraction = 2
  }
  else if (fraction <= 5) {
    niceFraction = 5
  }
  return niceFraction * 10 ** exponent
})
const start = computed(() => ~~(((props.size - props.offset) / props.zoom) / unit.value) * unit.value)
const end = computed(() => start.value + ~~(((props.vertical ? bbox.value?.height : bbox.value?.width) ?? 0) / props.zoom))
function logic2ui(num: number) {
  return ~~(num * props.zoom + props.offset)
}
function ui2logic(num: number) {
  return ~~((num - props.offset) / props.zoom)
}
function render() {
  const cvs = canvas.value
  if (!cvs || !offscreenCanvas.width || !offscreenCanvas.height)
    return

  ctx.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height)
  ctx.save()
  ctx.scale(pixelRatio.value, pixelRatio.value)
  if (props.vertical) {
    ctx.scale(1, -1)
    ctx.translate(0, 0)
    ctx.rotate(-Math.PI / 2)
  }

  drawAabb()

  drawAxis([props.size, props.size], Math.max(cvs.width, cvs.height), 2, props.color)

  const drawPrimary = (tick: number, label: string) => {
    drawTick(tick, 10)
    drawText(label, tick + 2, 4, 8, props.color)
  }

  const drawSecondary = (tick: number) => {
    drawTick(tick, 4)
  }

  ctx.lineWidth = 1
  ctx.strokeStyle = props.color
  ctx.beginPath()
  for (let tick = start.value; tick <= end.value; tick += unit.value) {
    if (tick % (unit.value * 10) === 0) {
      drawPrimary(logic2ui(tick), String(tick))
    }
    else if (tick % unit.value === 0) {
      drawSecondary(logic2ui(tick))
    }
  }
  ctx.stroke()

  ctx.restore()

  if ('transferToImageBitmap' in offscreenCanvas) {
    cvs.getContext('bitmaprenderer')!.transferFromImageBitmap(offscreenCanvas.transferToImageBitmap())
  }
  else {
    const mainCtx = cvs.getContext('2d')
    if (mainCtx) {
      mainCtx.clearRect(0, 0, cvs.width, cvs.height)
      mainCtx.drawImage(offscreenCanvas, 0, 0)
    }
  }
}

watch(
  [canvas, () => props.zoom, () => props.offset, () => props.aabb],
  () => {
    render()
  },
  { immediate: true, deep: true },
)

const resize = useDebounceFn(() => {
  if (!canvas.value)
    return

  const box = (canvas.value.parentElement as HTMLElement).getBoundingClientRect()
  offscreenCanvas.width = canvas.value.width = box.width * pixelRatio.value
  offscreenCanvas.height = canvas.value.height = box.height * pixelRatio.value
  canvas.value.style.width = `${box.width}px`
  canvas.value.style.height = `${box.height}px`
  bbox.value = box
  render()
}, 50)

onMounted(resize)

onBeforeUnmount(() => {
  offscreenCanvas.width = 0
  offscreenCanvas.height = 0
})

const savedLines = ref<number[]>([])
const tempLine = ref<number>()
const lines = computed(() => {
  const res = [...savedLines.value]
  if (typeof tempLine.value === 'number')
    res.unshift(tempLine.value)
  return res
})

function getTick(e: MouseEvent) {
  return ui2logic(
    props.vertical
      ? e.clientY - bbox.value!.top
      : e.clientX - bbox.value!.left,
  )
}

function onMove(e: MouseEvent, temp = false) {
  const tick = getTick(e)
  if (temp) {
    tempLine.value = tick
  }
  tipText.value = `${tick}px`
  tipPos.value = { x: e.clientX, y: e.clientY }
}

function onLeave() {
  tempLine.value = undefined
  tipText.value = undefined
}

function onClick(e: MouseEvent) {
  savedLines.value.push(getTick(e))
}

function onDblclick(index: number) {
  savedLines.value.splice(index, 1)
}

const dragLineIndex = ref<number>()

function dragMove(e: MouseEvent) {
  if (typeof dragLineIndex.value === 'number') {
    savedLines.value[dragLineIndex.value] = getTick(e)
  }
}

function stopDrag() {
  window.removeEventListener('mousemove', dragMove)
}

function startDrag(e: MouseEvent, index: number) {
  e.preventDefault()
  dragLineIndex.value = index
  window.addEventListener('mousemove', dragMove)
  window.addEventListener('mouseup', stopDrag)
}
</script>

<template>
  <div
    v-for="(item, index) in lines" :key="index"
    class="mce-ruler-refline"
    :class="{
      'mce-ruler-refline--vertical': props.vertical,
      'mce-ruler-refline--horizontal': !props.vertical,
      'mce-ruler-refline--temp': item === tempLine,
    }"
    :style="{
      [props.vertical ? 'height' : 'width']: '0',
      [props.vertical ? 'width' : 'height']: '100%',
      [props.vertical ? 'top' : 'left']: `${logic2ui(item)}px`,
      [props.vertical ? 'left' : 'top']: 0,
    }"
    @dblclick="onDblclick(index)"
    @mousedown.stop="startDrag($event, index)"
    @mousemove="onMove"
    @mouseleave="onLeave"
  />

  <div
    v-resize-observer="resize"
    class="mce-ruler"
    :style="{
      width: props.vertical ? `${props.size}px` : '100%',
      height: props.vertical ? '100%' : `${props.size}px`,
    }"
  >
    <canvas
      ref="canvasTpl"
      class="mce-ruler__canvas"
      :width="props.size"
      :height="props.size"
      @mousemove="onMove($event, true)"
      @mouseleave="onLeave"
      @click="onClick"
    />
  </div>

  <Tooltip
    :model-value="!!tipText"
    :target="tipPos"
    :offset="24"
  >
    <div style="font-size: 12px; text-wrap: nowrap">
      {{ tipText }}
    </div>
  </Tooltip>
</template>

<style lang="scss">
.mce-ruler {
  position: absolute;
  left: 0;
  top: 0;

  &__canvas {
    pointer-events: auto;
    cursor: pointer;
    background-color: rgba(var(--mce-theme-surface), 1);
  }
}

.mce-ruler-refline {
  position: absolute;
  border-style: dashed;
  border-width: 0;
  border-color: rgba(var(--mce-theme-primary), 1);
  pointer-events: auto !important;

  &--vertical {
    border-top-width: 1px;
    cursor: ns-resize;
  }

  &--horizontal {
    border-left-width: 1px;
    cursor: ew-resize;
  }

  &--temp {
    border-color: rgba(var(--mce-theme-primary), .3);
  }
}
</style>

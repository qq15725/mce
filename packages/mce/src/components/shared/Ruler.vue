<script setup lang="ts">
import type { AxisAlignedBoundingBox } from '../../types'
import { vResizeObserver } from '@vueuse/components'
import { useDebounceFn } from '@vueuse/core'
import { computed, onBeforeUnmount, onMounted, ref, useAttrs, useTemplateRef, watch } from 'vue'
import Tooltip from './Tooltip.vue'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<{
    size?: number
    vertical?: boolean
    zoom?: number
    position?: number
    unit?: number
    unitFractions?: number[]
    selected?: AxisAlignedBoundingBox
    pixelRatio?: number
    refline?: boolean
    axis?: boolean
    labelFormat?: (tick: number) => string
  }>(),
  {
    size: 16,
    zoom: 1,
    position: 0,
    unit: 50,
    unitFractions: () => [1, 2, 5, 10],
    pixelRatio: window.devicePixelRatio || 1,
    axis: true,
    labelFormat: (tick: number) => String(tick),
  },
)

const attrs = useAttrs()

const pixelRatio = computed(() => props.pixelRatio)
const tipText = ref<string>()
const tipPos = ref({ x: 0, y: 0 })
const canvas = useTemplateRef('canvasTpl')
const offscreenCanvas = 'OffscreenCanvas' in window
  ? new OffscreenCanvas(props.size, props.size)
  : document.createElement('canvas')
const ctx = offscreenCanvas.getContext('2d') as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D
const box = ref<AxisAlignedBoundingBox>()

function drawSelected() {
  if (!props.selected?.width || !props.selected?.height)
    return
  ctx.fillStyle = '#6165FD20'
  const offset = props.vertical ? props.selected.top : props.selected.left
  const length = props.vertical ? props.selected.height : props.selected.width
  ctx.fillRect(offset, 0, length, props.size)
}

function drawAxis(point: number[], length: number, size: number, color: string) {
  ctx.lineWidth = size
  ctx.strokeStyle = color
  ctx.beginPath()
  ctx.moveTo(point[0], point[1])
  ctx.lineTo(point[0] + length, point[1])
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
  const idealUnit = Math.max(props.unit / props.zoom, 1)
  const unitFractions = props.unitFractions
  const exponent = Math.floor(Math.log10(idealUnit))
  const fraction = idealUnit / 10 ** exponent
  let niceFraction = unitFractions[unitFractions.length - 1]
  for (const cur of unitFractions) {
    if (fraction <= cur) {
      niceFraction = cur
      break
    }
  }
  return niceFraction * 10 ** exponent
})

const start = computed(() => {
  const value = -props.position / props.zoom
  return Math.floor(value / unit.value) * unit.value
})

const end = computed(() => {
  const len = (props.vertical ? box.value?.height : box.value?.width) ?? 0
  const value = len / props.zoom
  return start.value + Math.ceil(value / unit.value) * unit.value
})

function numToPx(num: number) {
  return Math.round(num * props.zoom + props.position)
}

function pxToNum(px: number) {
  return Math.round((px - props.position) / props.zoom)
}

let color: string | undefined

function render() {
  const cvs = canvas.value

  if (!cvs || !offscreenCanvas.width || !offscreenCanvas.height)
    return

  color ??= getComputedStyle(canvas.value).color

  ctx.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height)
  ctx.save()
  ctx.scale(pixelRatio.value, pixelRatio.value)

  if (props.vertical) {
    ctx.scale(1, -1)
    ctx.translate(0, 0)
    ctx.rotate(-Math.PI / 2)
  }

  drawSelected()

  if (props.axis) {
    const point = props.vertical
      ? [props.size, 0]
      : [0, props.size]
    drawAxis(point, Math.max(cvs.width, cvs.height), 2, color!)
  }

  const drawPrimary = (tick: number, label: string) => {
    drawTick(tick, 10)
    drawText(label, tick + 2, 4, 8, color!)
  }

  const drawSecondary = (tick: number) => drawTick(tick, 4)

  ctx.lineWidth = 1
  ctx.strokeStyle = color!
  ctx.beginPath()

  let inc = unit.value / 10
  inc = (inc > 0 ? 1 : -1) * Math.max(1, Math.abs(inc))
  for (let tick = start.value; tick <= end.value; tick += inc) {
    if (tick % unit.value === 0) {
      drawPrimary(numToPx(tick), props.labelFormat(tick))
    }
    else if (tick % inc === 0) {
      drawSecondary(numToPx(tick))
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
  [canvas, () => props.zoom, () => props.position, () => props.selected],
  () => {
    render()
  },
  { immediate: true, deep: true },
)

const resize = useDebounceFn(() => {
  if (!canvas.value)
    return
  const _box = (canvas.value.parentElement as HTMLElement).getBoundingClientRect()
  offscreenCanvas.width = canvas.value.width = _box.width * pixelRatio.value
  offscreenCanvas.height = canvas.value.height = _box.height * pixelRatio.value
  canvas.value.style.width = `${_box.width}px`
  canvas.value.style.height = `${_box.height}px`
  box.value = _box
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
  return pxToNum(
    props.vertical
      ? e.clientY - box.value!.top
      : e.clientX - box.value!.left,
  )
}

function onMousedown(e: MouseEvent) {
  const tick = getTick(e)
  if (props.refline) {
    savedLines.value.push(tick)
  }
}

function onMousemove(e: MouseEvent, temp = false) {
  const tick = getTick(e)
  if (props.refline && temp) {
    tempLine.value = tick
  }
  tipText.value = props.labelFormat(`${tick}`)
  tipPos.value = { x: e.clientX, y: e.clientY }
}

function onLeave() {
  tempLine.value = undefined
  tipText.value = undefined
}

function onReflineDblclick(index: number) {
  savedLines.value.splice(index, 1)
}

function onReflineMousedown(e: MouseEvent, index: number) {
  e.stopPropagation()
  e.preventDefault()
  const move = (e: MouseEvent) => {
    savedLines.value[index] = getTick(e)
  }
  const up = () => {
    window.removeEventListener('mousemove', move)
    window.removeEventListener('mouseup', up)
  }
  window.addEventListener('mousemove', move)
  window.addEventListener('mouseup', up)
}

defineExpose({
  box,
})
</script>

<template>
  <div
    v-resize-observer="resize"
    class="mce-ruler"
    :style="{
      width: props.vertical ? `${props.size}px` : '100%',
      height: props.vertical ? '100%' : `${props.size}px`,
    }"
    v-bind="attrs"
    @mousedown="onMousedown"
    @mousemove="onMousemove($event, true)"
    @mouseleave="onLeave"
  >
    <canvas
      ref="canvasTpl"
      class="mce-ruler__canvas"
      :width="props.size"
      :height="props.size"
    />
  </div>

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
      [props.vertical ? 'top' : 'left']: `${numToPx(item)}px`,
      [props.vertical ? 'left' : 'top']: 0,
    }"
    @dblclick="onReflineDblclick(index)"
    @mousedown="onReflineMousedown($event, index)"
    @mousemove="() => tipText = `${item}`"
    @mouseleave="onLeave"
  />

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
    display: block;
    pointer-events: auto;
    cursor: pointer;
    background-color: rgb(var(--mce-theme-surface));
    color: rgba(var(--mce-theme-on-background), var(--mce-low-emphasis-opacity));
    backdrop-filter: blur(var(--mce-blur));
  }
}

.mce-ruler-refline {
  position: absolute;
  border-style: dashed;
  border-width: 0;
  border-color: rgb(var(--mce-theme-primary));
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
    border-color: rgba(var(--mce-theme-primary), var(--mce-low-emphasis-opacity));
    pointer-events: none !important;
  }
}
</style>

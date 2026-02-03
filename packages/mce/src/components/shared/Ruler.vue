<script setup lang="ts">
import type { AxisAlignedBoundingBox } from '../../types'
import { vResizeObserver } from '@vueuse/components'
import { useDebounceFn } from '@vueuse/core'
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  useAttrs,
  useTemplateRef,
  watch,
} from 'vue'
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
    borderColor?: string
    textColor?: string
    lineColor?: string
    locked?: boolean
    labelFormat?: (tick: number) => string
  }>(),
  {
    size: 16,
    zoom: 1,
    position: 0,
    unit: 50,
    unitFractions: () => [1, 2, 5, 10],
    pixelRatio: window.devicePixelRatio || 1,
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

const borderColor = computed(() => props.borderColor ?? (canvas.value ? window.getComputedStyle(canvas.value).getPropertyValue('--text-color').trim() : '#000'))
const textColor = computed(() => props.textColor ?? (canvas.value ? window.getComputedStyle(canvas.value).getPropertyValue('--text-color').trim() : '#000'))
const lineColor = computed(() => props.lineColor ?? 'rgb(var(--mce-theme-primary))')

function drawSelected() {
  if (!props.selected?.width || !props.selected?.height)
    return
  ctx.fillStyle = '#6165FD20'
  const offset = props.vertical ? props.selected.top : props.selected.left
  const length = props.vertical ? props.selected.height : props.selected.width
  ctx.fillRect(offset, 0, length, props.size)
}

function drawAxis(start: number[], end: number[], size: number, color: string) {
  ctx.lineWidth = size
  ctx.strokeStyle = color
  ctx.beginPath()
  ctx.moveTo(start[0], start[1])
  ctx.lineTo(end[0], end[1])
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

function drawText(content: string, tick: number, top: number, size: number) {
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
  const value = props.position / props.zoom
  return Math.floor(value / unit.value) * unit.value
})

const end = computed(() => {
  const len = (props.vertical ? box.value?.height : box.value?.width) ?? 0
  const value = len / props.zoom
  return start.value + Math.ceil(value / unit.value) * unit.value
})

function numToPx(num: number) {
  return Math.round(num * props.zoom - props.position)
}

function pxToNum(px: number) {
  return Math.round((px + props.position) / props.zoom)
}

const renderTransfer = 'transferToImageBitmap' in offscreenCanvas
  ? (cvs: HTMLCanvasElement) => {
      cvs.getContext('bitmaprenderer')!.transferFromImageBitmap(offscreenCanvas.transferToImageBitmap())
    }
  : (cvs: HTMLCanvasElement) => {
      const ctx = cvs.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, cvs.width, cvs.height)
        ctx.drawImage(offscreenCanvas, 0, 0)
      }
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

  drawSelected()

  if (props.axis) {
    drawAxis(
      [0, props.size],
      [props.vertical ? cvs.height : cvs.width, props.size],
      2,
      borderColor.value,
    )
  }

  const drawPrimary = (tick: number, label: string) => {
    drawTick(tick, 10)
    drawText(label, tick + 2, 4, 8)
  }

  const drawSecondary = (tick: number) => drawTick(tick, 4)

  let inc = unit.value / 10
  inc = (inc > 0 ? 1 : -1) * Math.max(1, Math.abs(inc))

  ctx.beginPath()
  ctx.lineWidth = 1
  ctx.strokeStyle = textColor.value
  ctx.fillStyle = textColor.value
  for (let tick = start.value; tick <= end.value; tick += inc) {
    if (tick % unit.value === 0) {
      drawPrimary(numToPx(tick), props.labelFormat(tick))
    }
  }
  ctx.stroke()
  ctx.beginPath()
  ctx.lineWidth = 1
  ctx.strokeStyle = borderColor.value
  for (let tick = start.value; tick <= end.value; tick += inc) {
    if (tick % unit.value === 0) {
      //
    }
    else if (tick % inc === 0) {
      drawSecondary(numToPx(tick))
    }
  }
  ctx.stroke()

  ctx.restore()

  renderTransfer(cvs)
}

watch(
  [canvas, () => props.zoom, () => props.position, () => props.selected, () => borderColor.value, () => textColor.value],
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

const savedLines = defineModel<number[]>({ default: () => [] })
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
  tipText.value = props.labelFormat(tick)
  tipPos.value = { x: e.clientX, y: e.clientY }
}

function onLeave() {
  tempLine.value = undefined
  tipText.value = undefined
}

function onReflineDblclick(index: number) {
  if (props.locked) {
    return
  }
  savedLines.value.splice(index, 1)
}

function onReflineMousedown(e: MouseEvent, index: number) {
  if (props.locked) {
    return
  }
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
    :class="[
      `mce-ruler--${props.vertical ? 'vertical' : 'horizontal'}`,
    ]"
    :style="{ '--size': `${props.size}px` }"
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
      'mce-ruler-refline--locked': props.locked,
    }"
    :style="{
      [props.vertical ? 'height' : 'width']: '0',
      [props.vertical ? 'width' : 'height']: '100%',
      [props.vertical ? 'top' : 'left']: `${numToPx(item)}px`,
      [props.vertical ? 'left' : 'top']: 0,
      '--line-color': lineColor,
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
    <div style="font-size: 0.75rem; text-wrap: nowrap">
      {{ tipText }}
    </div>
  </Tooltip>
</template>

<style lang="scss">
.mce-ruler {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  --text-color: rgba(var(--mce-theme-on-background), var(--mce-low-emphasis-opacity));
  --border-color: rgba(var(--mce-border-color), var(--mce-border-opacity));

  &--vertical {
    width: var(--size);
    cursor: ew-resize;
  }

  &--horizontal {
    height: var(--size);
    cursor: ns-resize;
  }

  &__canvas {
    display: block;
    pointer-events: auto;
    background-color: rgb(var(--mce-theme-surface));
    backdrop-filter: blur(var(--mce-blur));
  }
}

.mce-ruler-refline {
  position: absolute;
  border-style: dashed;
  border-width: 0;
  border-color: var(--line-color);
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
    opacity: var(--mce-low-emphasis-opacity);
    pointer-events: none !important;
  }

  &--locked {
    cursor: not-allowed;
  }
}
</style>

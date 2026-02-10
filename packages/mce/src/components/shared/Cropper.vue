<script setup lang="ts">
import type { ImageFillCropRect } from 'modern-idoc'
import { vResizeObserver } from '@vueuse/components'
import { useImage } from '@vueuse/core'
import { cloneDeep, isEqual } from 'lodash-es'
import { computed, onBeforeMount, onBeforeUnmount, ref, useTemplateRef, watch } from 'vue'
import { boundingBoxToStyle } from '../../utils'
import Transform from './Transform.vue'

/**
 * TODO 撤回无法重渲
 */
type View = Record<'left' | 'top' | 'width' | 'height' | 'scaleX' | 'scaleY', number>
const props = defineProps<{
  image: string
}>()

const emit = defineEmits<{
  start: []
  end: []
}>()

/**
 * CropRect (value are based on Source !!!)
 *
 * @example
 *
 * cropRect: { left: 0.3, top: 0.3, right: 0.3, bottom: 0.3 }
 *
 * Before:
 *
 *       View (Source)
 *     |---0---|
 *     |       |
 *     0       0
 *     |       |
 *     |---0---|
 *
 * After:
 *
 *  Source
 *  |----- 0 -----|
 *  |    View     |
 *  |  |--0.3--|  |
 *  |  |       |  |
 *  0 0.3     0.3 0
 *  |  |       |  |
 *  |  |--0.3--|  |
 *  |             |
 *  |----- 0 -----|
 */
const cropRect = defineModel<ImageFillCropRect>({ default: () => ({}) })
const cropBackup = cloneDeep(cropRect.value)
const internalValue = computed({
  get: () => {
    const { left = 0, top = 0, right = 0, bottom = 0 } = cropRect.value
    return { left, top, right, bottom }
  },
  set: val => cropRect.value = val,
})

const view = defineModel<View>('view', { required: true })
const viewBackup = cloneDeep(view.value)

const inverseMat = computed(() => {
  const { left, top, right, bottom } = internalValue.value
  const sx = 1 / (1 - left - right)
  const sy = 1 / (1 - top - bottom)
  const tx = -left
  const ty = -top
  return { sx, sy, tx, ty }
})
const rootBox = ref({ width: 0, height: 0 })
function onResizeObserver(entries: ResizeObserverEntry[]) {
  const { width, height } = entries[0].contentRect
  rootBox.value = { width, height }
}
function applyInverseMat({ width, height }: { width: number, height: number }) {
  const { sx, sy, tx, ty } = inverseMat.value
  const { scaleX = 1, scaleY = 1 } = view.value
  return {
    width: sx * width,
    height: sy * height,
    left: tx * scaleX * (sx * width),
    top: ty * scaleY * (sy * height),
  }
}
const sourceTransform = computed({
  get: () => applyInverseMat(rootBox.value),
  set: (newValue) => {
    const { width, height } = rootBox.value
    const { scaleX = 1, scaleY = 1 } = view.value
    const transform = {
      sx: newValue.width / width,
      sy: newValue.height / height,
      tx: newValue.left / newValue.width / scaleX,
      ty: newValue.top / newValue.height / scaleY,
    }
    const left = -transform.tx
    const top = -transform.ty
    const w = 1 - (1 / transform.sx)
    const h = 1 - (1 / transform.sy)
    const right = w - left
    const bottom = h - top
    internalValue.value = { left, top, right, bottom }
  },
})

// 外部view变化需要通过调整cropRect保持source视觉位置尺寸不变
const viewEffect = watch(view, (val, old) => {
  if (!isEqual(val, old)) {
    const source = applyInverseMat(old)
    const left = (val.left - old.left - source.left) / source.width
    const top = (val.top - old.top - source.top) / source.height
    const right = 1 - left - (val.width / source.width)
    const bottom = 1 - top - (val.height / source.height)
    internalValue.value = { left, top, right, bottom }
  }
})

function setScale(value: number) {
  const { sx: oldSx, sy: oldSy } = inverseMat.value
  const { left: oldLeft, top: oldTop, right: oldRight, bottom: oldBottom } = internalValue.value

  // 原view宽高
  const oldViewWidth = 1 - oldLeft - oldRight
  const oldViewHeight = 1 - oldTop - oldBottom

  // 原view中心点
  const centerX = oldLeft + oldViewWidth * 0.5
  const centerY = oldTop + oldViewHeight * 0.5

  // 保持原宽高比
  const newSx = value
  const newSy = value * (oldSy / oldSx)

  // 新view宽高
  const newViewWidth = 1 / newSx
  const newViewHeight = 1 / newSy

  // 保持中心点位置不变
  const newLeft = centerX - newViewWidth * 0.5
  const newTop = centerY - newViewHeight * 0.5
  const newRight = 1 - newViewWidth - newLeft
  const newBottom = 1 - newViewHeight - newTop

  internalValue.value = {
    left: newLeft,
    top: newTop,
    right: newRight,
    bottom: newBottom,
  }
}
const scale = computed({
  get: () => inverseMat.value.sx,
  set: setScale,
})

function ok() {
  emit('end')
}

function cancel() {
  cropRect.value = cropBackup
  viewEffect.stop()
  view.value = viewBackup
  ok()
}

function setAspectRatio(ratio: 0 | [number, number]) {
  const { left = 0, top = 0 } = view.value
  const { left: sourceLeft, top: sourceTop, width: sourceWidth, height: sourceHeight } = applyInverseMat(view.value)
  const aspectRatio = ratio === 0 ? sourceWidth / sourceHeight : ratio[0] / ratio[1]

  let newViewWidth = sourceWidth
  let newViewHeight = sourceWidth / aspectRatio
  if (newViewHeight > sourceHeight) {
    newViewHeight = sourceHeight
    newViewWidth = sourceHeight * aspectRatio
  }
  const newViewLeft = left + sourceLeft + (sourceWidth - newViewWidth) / 2
  const newViewTop = top + sourceTop + (sourceHeight - newViewHeight) / 2

  view.value = {
    ...view.value,
    width: newViewWidth,
    height: newViewHeight,
    left: newViewLeft,
    top: newViewTop,
  }
}

const { state: imageRef } = useImage(
  computed(() => ({
    src: props.image,
  })),
)
const canvasRef = useTemplateRef('canvasRef')
watch([canvasRef, imageRef], render)
watch(internalValue, render, { deep: true })
watch([() => view.value.scaleX, () => view.value.scaleY], render)
function render() {
  const ctx = canvasRef.value?.getContext('2d')
  if (!ctx || !imageRef.value)
    return
  const { scaleX = 1, scaleY = 1 } = view.value
  const { naturalWidth, naturalHeight } = imageRef.value
  ctx.canvas.width = naturalWidth
  ctx.canvas.height = naturalHeight
  ctx.clearRect(0, 0, naturalWidth, naturalHeight)
  ctx.globalAlpha = 0.4
  ctx.scale(scaleX, scaleY)
  ctx.drawImage(imageRef.value, 0, 0, naturalWidth, naturalHeight)
}

onBeforeMount(() => emit('start'))
onBeforeUnmount(() => emit('end'))
</script>

<template>
  <div
    v-resize-observer="onResizeObserver"
    class="mce-cropper"
  >
    <div
      class="mce-cropper__source"
      :style="boundingBoxToStyle(sourceTransform)"
    >
      <canvas ref="canvasRef" />
    </div>

    <Transform
      v-slot="{ props: slotProps }"
      v-model="sourceTransform"
      class="mce-cropper__transform"
      :rotatable="false"
    >
      <div class="mce-cropper__transform_rect" v-bind="slotProps" />
    </Transform>

    <slot
      :scale="scale"
      :set-scale="setScale"
      :ok="ok"
      :cancel="cancel"
      :set-aspect-ratio="setAspectRatio"
    />
  </div>
</template>

<style lang="scss">
  .mce-cropper {
    pointer-events: auto;
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;

    &__source {
      position: absolute;
      width: 100%;
      height: 100%;
      transform-origin: top left;

      canvas {
        position: absolute;
        width: 100%;
        height: 100%;
      }
    }

    &__transform {
      position: absolute;
      color: rgba(var(--mce-theme-primary), 1);
      opacity: .5;
    }

    &__transform_rect {
      width: 100%;
      height: 100%;
    }
  }
</style>

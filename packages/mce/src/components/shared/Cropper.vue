<script setup lang="ts">
import type { ImageFillCropRect } from 'modern-idoc'
import { vResizeObserver } from '@vueuse/components'
import { useImage } from '@vueuse/core'
import { cloneDeep } from 'lodash-es'
import { computed, onBeforeMount, onBeforeUnmount, ref, useTemplateRef, watch } from 'vue'
import Transformable from './Transformable.vue'

/**
 * TODO 撤回无法重渲
 */

const props = withDefaults(
  defineProps<{
    image: string
    minScale?: number
    maxScale?: number
  }>(),
  {
    minScale: 0.1,
    maxScale: 3,
  },
)

const emit = defineEmits<{
  'start': []
  'end': []
  'update:transform': [{ left: number, top: number, width: number, height: number }]
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
const styleModel = defineModel<Record<string, any>>('style', { default: () => ({}) })
const rootBox = ref({ width: 0, height: 0 })
const { state: imageRef } = useImage(
  computed(() => ({
    src: props.image,
  })),
)
const backup = cloneDeep(cropRect.value)
const canvasRef = useTemplateRef('canvasRef')
const computedCropRect = computed({
  get: () => {
    const { left = 0, top = 0, right = 0, bottom = 0 } = cropRect.value
    return { left, top, right, bottom }
  },
  set: val => cropRect.value = val,
})

const inverseMat = computed(() => {
  const { left, top, right, bottom } = computedCropRect.value
  const sx = 1 / (1 - left - right)
  const sy = 1 / (1 - top - bottom)
  const tx = -left
  const ty = -top
  return { sx, sy, tx, ty }
})

const sourceTransform = computed({
  get: () => {
    const { sx, sy, tx, ty } = inverseMat.value
    const { scaleX = 1, scaleY = 1 } = styleModel.value
    const { width, height } = rootBox.value
    return {
      width: sx * width,
      height: sy * height,
      left: tx * scaleX * (sx * width),
      top: ty * scaleY * (sy * height),
    }
  },
  set: (newValue) => {
    const { width, height } = rootBox.value
    const { scaleX = 1, scaleY = 1 } = styleModel.value
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
    computedCropRect.value = { left, top, right, bottom }
  },
})

const scale = computed({
  get: () => inverseMat.value.sx,
  set: (value) => {
    const transform = inverseMat.value
    const rate = transform.sx / value
    const left = -transform.tx
    const top = -transform.ty
    const w = 1 - (1 / value)
    const h = 1 - (1 / transform.sy * rate)
    const right = w - left
    const bottom = h - top
    computedCropRect.value = { left, top, right, bottom }
  },
})

onBeforeMount(() => emit('start'))
onBeforeUnmount(() => emit('end'))

const sourceStyle = computed(() => {
  const { sx, sy, tx, ty } = inverseMat.value
  const { scaleX = 1, scaleY = 1 } = styleModel.value
  return {
    transform: [
      `scale(${sx}, ${sy})`,
      `translate(${tx * scaleX * 100}%, ${ty * scaleY * 100}%)`,
    ].join(' '),
  }
})

watch([canvasRef, imageRef], render)
watch(computedCropRect, render, { deep: true })
watch([() => styleModel.value.scaleX, () => styleModel.value.scaleY], render)

function render() {
  const ctx = canvasRef.value?.getContext('2d')
  if (!ctx || !imageRef.value)
    return
  const { scaleX = 1, scaleY = 1 } = styleModel.value
  const { naturalWidth, naturalHeight } = imageRef.value
  ctx.canvas.width = naturalWidth
  ctx.canvas.height = naturalHeight
  ctx.clearRect(0, 0, naturalWidth, naturalHeight)
  ctx.globalAlpha = 0.4
  ctx.scale(scaleX, scaleY)
  ctx.drawImage(imageRef.value, 0, 0, naturalWidth, naturalHeight)
}

function ok() {
  emit('end')
}

function cancel() {
  cropRect.value = backup
  ok()
}

function onResizeObserver(entries: any) {
  const { width, height } = entries[0].contentRect
  rootBox.value = { width, height }
}

function applySourceTransformToStyle() {
  const { left = 0, top = 0, width = 0, height = 0 } = styleModel.value
  const { sx, sy, tx, ty } = inverseMat.value
  cropRect.value = {}
  styleModel.value = {
    ...styleModel.value,
    width: sx * width,
    height: sy * height,
    left: left + tx * (sx * width),
    top: top + ty * (sy * height),
  }
  ok()
}
</script>

<template>
  <div
    v-resize-observer="onResizeObserver"
    class="mce-cropper"
  >
    <div
      class="mce-cropper__source"
      :style="sourceStyle"
    >
      <canvas ref="canvasRef" />
    </div>

    <Transformable
      v-slot="{ props: slotProps }"
      v-model="sourceTransform"
      class="mce-cropper__transformable"
      :rotatable="false"
    >
      <div class="mce-cropper__transformable_rect" v-bind="slotProps" />
    </Transformable>

    <slot
      :scale="scale"
      :ok="ok"
      :cancel="cancel"
      :apply-source-transform-to-style="applySourceTransformToStyle"
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

    &__transformable {
      position: absolute;
      color: rgba(var(--mce-theme-primary), 1);
      opacity: .5;
    }

    &__transformable_rect {
      width: 100%;
      height: 100%;
    }
  }
</style>

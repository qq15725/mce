<script setup lang="ts">
import type { Element2D, Obb2D } from 'modern-canvas'
import type { TransformableValue } from './shared/TransformControls.vue'
import { Aabb2D } from 'modern-canvas'
import { computed, onBeforeMount, onBeforeUnmount, ref, useTemplateRef } from 'vue'
import { useEditor } from '../composables/editor'
import { boundingBoxToStyle } from '../utils/box'
import TransformControls from './shared/TransformControls.vue'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<{
  resizeStrategy?: 'lockAspectRatio' | 'lockAspectRatioDiagonal'
  selectedArea?: Aabb2D
}>(), {
  selectedArea: () => new Aabb2D(),
})

const {
  emit,
  isElement,
  state,
  resizeElement,
  selection,
  elementSelection,
  selectionObb,
  selectionObbInDrawboard,
  camera,
  obbToFit,
  getObb,
  registerCommand,
  unregisterCommand,
  inEditorIs,
  isLock,
  config,
  snapThreshold,
  getSnapPoints,
  hoverElement,
} = useEditor()

const transformable = useTemplateRef('transformableTpl')
const startEvent = ref<MouseEvent | PointerEvent>()

onBeforeMount(() => {
  registerCommand({
    command: 'startTransform',
    handle: (event) => {
      startEvent.value = event
      Boolean(transformable.value?.start(event))
    },
  })
})

onBeforeUnmount(() => {
  unregisterCommand('startTransform')
})

const parentObbStyles = computed(() => {
  if (selection.value.length !== 1) {
    return []
  }
  const obbs: Obb2D[] = []
  selection.value[0]?.findAncestor((ancestor) => {
    if (isElement(ancestor)) {
      obbs.push(getObb(ancestor as Element2D, 'drawboard'))
    }
    return false
  })
  return obbs.map(obb => obb.toCssStyle())
})

const selectionObbStyles = computed(() => {
  if (
    state.value !== 'selecting'
    && elementSelection.value.length === 1
  ) {
    return []
  }

  return elementSelection.value.map((el) => {
    const box = getObb(el, 'drawboard')
    return {
      ...box.toCssStyle(),
      borderRadius: `${(el.style.borderRadius ?? 0) * camera.value.zoom.x}px`,
    }
  })
})

const _transform = computed(() => {
  const zoom = camera.value.zoom
  const { left, top, width, height, rotationDegrees } = selectionObbInDrawboard.value
  return {
    left,
    top,
    width,
    height,
    rotate: rotationDegrees,
    borderRadius: (elementSelection.value[0]?.style.borderRadius ?? 0) * zoom.x,
  }
})

function snap(currentPos: number, type: 'x' | 'y'): number {
  const points = getSnapPoints()
  const zoom = camera.value.zoom
  const position = camera.value.position
  let closest: undefined | number
  let minDist = Infinity

  if (type === 'x') {
    currentPos += position.x / zoom.x
  }
  else {
    currentPos += position.y / zoom.y
  }

  for (const pt of points[type]) {
    const dist = pt - currentPos
    const absDist = Math.abs(dist)
    if (absDist < minDist) {
      minDist = absDist
      closest = pt
    }
  }

  if (minDist <= snapThreshold.value) {
    currentPos = closest ?? currentPos
  }

  if (type === 'x') {
    currentPos -= position.x / zoom.x
  }
  else {
    currentPos -= position.y / zoom.y
  }

  return currentPos
}

function createSelectionTransformContext(): Mce.SelectionTransformContext {
  return {
    startEvent: startEvent.value!,
    handle: (transformable.value?.activeHandle ?? 'move') as Mce.TransformableHandle,
    elements: elementSelection.value,
  }
}

const transform = computed({
  get: () => _transform.value,
  set: (val: TransformableValue) => {
    const handle: string = transformable.value?.activeHandle ?? 'move'
    const zoom = camera.value.zoom
    const oldTransform = _transform.value
    const transform = {
      left: val.left / zoom.x,
      top: val.top / zoom.y,
      width: Math.max(1, val.width / zoom.x),
      height: Math.max(1, val.height / zoom.y),
      rotate: val.rotate ?? 0,
      borderRadius: (val.borderRadius ?? 0) / zoom.y,
    }

    if (handle === 'move') {
      transform.left = snap(Math.round(transform.left), 'x')
      transform.top = snap(Math.round(transform.top), 'y')
    }

    const offsetStyle = {
      left: transform.left - oldTransform.left / zoom.x,
      top: transform.top - oldTransform.top / zoom.y,
      width: transform.width - oldTransform.width / zoom.x,
      height: transform.height - oldTransform.height / zoom.y,
      rotate: transform.rotate - (oldTransform.rotate ?? 0),
      borderRadius: transform.borderRadius - (oldTransform.borderRadius ?? 0) / zoom.y,
    }

    elementSelection.value.forEach((element) => {
      const style = element.style

      const newStyle = {
        left: style.left + offsetStyle.left,
        top: style.top + offsetStyle.top,
        width: style.width + offsetStyle.width,
        height: style.height + offsetStyle.height,
        rotate: style.rotate + offsetStyle.rotate,
        borderRadius: Math.round(style.borderRadius + offsetStyle.borderRadius),
      }

      if (handle.startsWith('rotate')) {
        newStyle.rotate = Math.round(newStyle.rotate * 100) / 100
      }
      else if (handle.startsWith('resize')) {
        const scale = newStyle.rotate ? 100 : 1
        newStyle.width = Math.round(newStyle.width * scale) / scale
        newStyle.height = Math.round(newStyle.height * scale) / scale
        const shape = element.shape

        resizeElement(
          element,
          newStyle.width / element.style.width,
          newStyle.height / element.style.height,
          inEditorIs(element, 'Frame')
            ? undefined
            : shape.isValid()
              ? { deep: true }
              : handle.split('-')[1].length > 1
                ? { deep: true, textFontSizeToFit: true }
                : { deep: true, textToFit: true },
        )
        newStyle.width = element.style.width
        newStyle.height = element.style.height
      }

      Object.assign(style, newStyle)
      element.updateGlobalTransform()
      element.findAncestor((ancestor) => {
        if (
          isElement(ancestor)
          && !inEditorIs(ancestor, 'Frame')
        ) {
          obbToFit(ancestor)
        }
        return false
      })
    })

    emit('selectionTransforming', createSelectionTransformContext())
  },
})

const movable = computed(() => {
  return elementSelection.value.every((element) => {
    return !isLock(element)
      && element.meta.movable !== false
      && element.meta.transformable !== false
  })
})

const resizable = computed(() => {
  return elementSelection.value.every((element) => {
    return !isLock(element)
      && element.meta.resizable !== false
      && element.meta.transformable !== false
  })
})

const rotatable = computed(() => {
  return elementSelection.value.every((element) => {
    return !isLock(element)
      && element.meta.rotatable !== false
      && element.meta.transformable !== false
  })
})

const roundable = computed(() => {
  if (elementSelection.value.length === 1) {
    const element = elementSelection.value[0]
    return hoverElement.value?.equal(element)
      && !isLock(element)
      && element.foreground.isValid()
  }
  return false
})

function onStart() {
  emit('selectionTransformStart', createSelectionTransformContext())
}

function onMove() {
  if (!state.value) {
    state.value = 'transforming'
  }
}

function onEnd() {
  if (state.value === 'transforming') {
    state.value = undefined
  }
  emit('selectionTransformEnd', createSelectionTransformContext())
}

function tipFormat() {
  const obb = elementSelection.value.length === 1
    ? elementSelection.value[0].style
    : selectionObb.value
  return `${Number(obb.width.toFixed(2))} × ${Number(obb.height.toFixed(2))}`
}

defineExpose({
  transformable,
})
</script>

<template>
  <div
    v-for="(style, index) in parentObbStyles" :key="index"
    class="mce-selector__parent-element"
    :style="{
      borderColor: 'currentColor',
      ...style,
    }"
  />

  <div
    v-if="state === 'selecting'"
    class="mce-selector__selected-area"
    :style="{
      borderColor: 'currentcolor',
      ...props.selectedArea.toCssStyle(),
    }"
  />

  <div
    v-for="(style, index) in selectionObbStyles"
    :key="index"
    class="mce-selector__element"
    :style="{
      borderColor: 'currentcolor',
      ...style,
    }"
  />

  <TransformControls
    v-if="transform.width && transform.height"
    ref="transformableTpl"
    v-bind="config.transformControls"
    v-model="transform"
    :movable="state !== 'typing' && movable"
    :resizable="state !== 'typing' && resizable"
    :rotatable="state !== 'typing' && rotatable"
    :roundable="state !== 'typing' && roundable"
    :resize-strategy="props.resizeStrategy"
    class="mce-selector__transform"
    :border-style="elementSelection.length > 1 ? 'dashed' : 'solid'"
    :tip-format="tipFormat"
    @start="onStart"
    @move="onMove"
    @end="onEnd"
  >
    <template v-if="$slots.transformable" #svg="slotProps">
      <slot name="transformable" v-bind="slotProps" />
    </template>
  </TransformControls>

  <template
    v-if="transform.width && transform.height && $slots.default"
  >
    <div
      class="mce-selector__slot"
      :style="boundingBoxToStyle(transform)"
    >
      <slot :box="transform" />
    </div>
  </template>
</template>

<style lang="scss">
  .mce-selector__slot {
    position: absolute;
  }

  .mce-selector__parent-element {
    position: absolute;
    pointer-events: none;
    border-width: 1px;
    border-style: dashed;
    color: rgba(var(--mce-theme-primary), 1);
    opacity: .5;
  }

  .mce-selector__selected-area {
    position: absolute;
    border-width: 1px;
    border-style: solid;
    color: rgba(var(--mce-theme-primary), 1);
    background-color: rgba(var(--mce-theme-primary), .1);
  }

  .mce-selector__transform {
    position: absolute;
    color: rgba(var(--mce-theme-primary), 1);
  }

  .mce-selector__element {
    position: absolute;
    border-width: 1px;
    border-style: solid;
    color: rgba(var(--mce-theme-primary), 1);
  }
</style>

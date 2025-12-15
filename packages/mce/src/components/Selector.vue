<script setup lang="ts">
import type { Element2D, Obb2D } from 'modern-canvas'
import type { TransformableValue } from './shared/Transformable.vue'
import { Aabb2D } from 'modern-canvas'
import { computed, onBeforeMount, onBeforeUnmount, useTemplateRef } from 'vue'
import { useEditor } from '../composables/editor'
import { boundingBoxToStyle } from '../utils/box'
import Transformable from './shared/Transformable.vue'

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
  isFrame,
  isLock,
  config,
  snapThreshold,
  getSnapPoints,
  handleElementInsideFrame,
} = useEditor()

const transformable = useTemplateRef('transformableTpl')

onBeforeMount(() => {
  registerCommand({ command: 'startTransform', handle: e => Boolean(transformable.value?.start(e)) })
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
          isFrame(element)
            ? undefined
            : (
                !shape.enabled
                || !(shape as any)._path2DSet.paths.length
              )
                ? handle.split('-').length > 2
                  ? { deep: true, textFontSizeToFit: true }
                  : { deep: true, textToFit: true }
                : undefined,
        )
        newStyle.width = element.style.width
        newStyle.height = element.style.height
      }

      Object.assign(style, newStyle)
      element.updateGlobalTransform()
      element.findAncestor((ancestor) => {
        if (
          isElement(ancestor)
          && !isFrame(ancestor)
        ) {
          obbToFit(ancestor)
        }
        return false
      })

      // move to frame
      handleElementInsideFrame(element)
    })
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

const adjustableBorderRadius = computed(() => {
  const element = elementSelection.value[0]!
  return elementSelection.value.length === 1
    && !isLock(element)
    && element.foreground.isValid()
})

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

  <Transformable
    v-if="transform.width && transform.height"
    ref="transformableTpl"
    v-model="transform"
    :movable="movable"
    :resizable="resizable"
    :rotatable="rotatable"
    :adjustable-border-radius="adjustableBorderRadius"
    :resize-strategy="props.resizeStrategy"
    :handle-shape="config.handleShape"
    class="mce-selector__transform"
    :border-style="elementSelection.length > 1 ? 'dashed' : 'solid'"
    :tip-format="tipFormat"
    @move="() => !state && (state = 'transforming')"
    @end="() => state === 'transforming' && (state = undefined)"
  >
    <template v-if="$slots.transformable" #svg="slotProps">
      <slot name="transformable" v-bind="slotProps" />
    </template>
  </Transformable>

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

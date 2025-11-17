<script setup lang="ts">
import type { Element2D } from 'modern-canvas'
import type { AxisAlignedBoundingBox, OrientedBoundingBox } from '../types'
import type { TransformableValue } from './shared/Transformable.vue'
import { computed, onBeforeMount, onBeforeUnmount, useTemplateRef } from 'vue'
import { useEditor } from '../composables/editor'
import { boundingBoxToStyle } from '../utils/box'
import Transformable from './shared/Transformable.vue'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<{
  resizeStrategy?: 'lockAspectRatio' | 'lockAspectRatioDiagonal'
  selectedArea?: AxisAlignedBoundingBox
}>(), {
  selectedArea: () => ({ left: 0, top: 0, width: 0, height: 0 }),
})

const {
  isElement,
  state,
  resizeElement,
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
} = useEditor()

const transformable = useTemplateRef('transformableRef')

onBeforeMount(() => {
  registerCommand({ command: 'startTransform', handle: e => Boolean(transformable.value?.start(e)) })
})

onBeforeUnmount(() => {
  unregisterCommand('startTransform')
})

const parentObbs = computed(() => {
  if (elementSelection.value.length !== 1) {
    return []
  }
  const obbs: OrientedBoundingBox[] = []
  elementSelection.value[0]?.findAncestor((ancestor) => {
    if (isElement(ancestor)) {
      obbs.push(getObb(ancestor as Element2D, 'drawboard'))
    }
    return false
  })
  return obbs
})

const selectionObbs = computed(() => {
  if (
    state.value !== 'selecting'
    && elementSelection.value.length === 1
  ) {
    return []
  }

  return elementSelection.value.map((el) => {
    return {
      element: el,
      box: getObb(el, 'drawboard'),
    }
  })
})

const _selectionTransform = computed(() => {
  const zoom = camera.value.zoom
  return {
    ...selectionObbInDrawboard.value,
    borderRadius: (elementSelection.value[0]?.style.borderRadius ?? 0) * zoom.x,
  }
})
const selectionTransform = computed({
  get: () => _selectionTransform.value,
  set: (val: TransformableValue) => {
    const zoom = camera.value.zoom
    const oldTransform = _selectionTransform.value
    const offsetStyle = {
      left: (val.left - oldTransform.left) / zoom.x,
      top: (val.top - oldTransform.top) / zoom.y,
      width: Math.max(1, val.width / zoom.x) - oldTransform.width / zoom.x,
      height: Math.max(1, val.height / zoom.y) - oldTransform.height / zoom.y,
      rotate: (val.rotate ?? 0) - (oldTransform.rotate ?? 0),
      borderRadius: ((val.borderRadius ?? 0) - (oldTransform.borderRadius ?? 0)) / zoom.y,
    }

    const points = getSnapPoints()
    const snap = (currentPos: number, type: 'x' | 'y'): number => {
      let closest: undefined | number
      let minDist = Infinity
      for (const pt of points[type]) {
        const dist = pt - currentPos
        const absDist = Math.abs(dist)
        if (absDist < minDist) {
          minDist = absDist
          closest = pt
        }
      }
      if (minDist <= snapThreshold.value) {
        return closest
      }
      else {
        return currentPos
      }
    }

    const handle: string = transformable.value?.activeHandle ?? 'move'
    elementSelection.value.forEach((element) => {
      const style = element.style
      const newStyle = {
        left: style.left + offsetStyle.left,
        top: style.top + offsetStyle.top,
        width: style.width + offsetStyle.width,
        height: style.height + offsetStyle.height,
        rotate: style.rotate + offsetStyle.rotate,
        borderRadius: style.borderRadius + offsetStyle.borderRadius,
      }

      newStyle.left = snap(newStyle.left, 'x')
      newStyle.top = snap(newStyle.top, 'y')

      if (handle.startsWith('resize')) {
        resizeElement(
          element,
          newStyle.width / element.style.width,
          newStyle.height / element.style.height,
          isFrame(element)
            ? undefined
            : handle.split('-').length > 2
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
          && !isFrame(ancestor)
        ) {
          obbToFit(ancestor)
        }
        return false
      })
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
    v-for="(obb, index) in parentObbs" :key="index"
    class="mce-selector__parent-element"
    :style="{
      borderColor: 'currentColor',
      ...boundingBoxToStyle(obb),
    }"
  />

  <div
    v-if="state === 'selecting'"
    class="mce-selector__selected-area"
    :style="{
      borderColor: 'currentcolor',
      ...boundingBoxToStyle(props.selectedArea),
    }"
  />

  <div
    v-for="(item, index) in selectionObbs"
    :key="index"
    class="mce-selector__element"
    :style="{
      borderColor: 'currentcolor',
      borderRadius: `${(item.element.style.borderRadius ?? 0) * camera.zoom.x}px`,
      ...boundingBoxToStyle(item.box),
    }"
  />

  <Transformable
    v-if="selectionTransform.width && selectionTransform.height"
    ref="transformableRef"
    v-model="selectionTransform"
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

  <template v-if="selectionTransform.width && selectionTransform.height && $slots.default">
    <div
      class="mce-selector__slot"
      :style="boundingBoxToStyle(selectionTransform)"
    >
      <slot :box="selectionTransform" />
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

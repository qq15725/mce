<script setup lang="ts">
import type { AxisAlignedBoundingBox, OrientedBoundingBox } from '../types'
import type { TransformableValue } from './shared/Transformable.vue'
import { Element2D } from 'modern-canvas'
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
  state,
  resizeElement,
  elementSelection,
  camera,
  obbToFit,
  getObbInDrawboard,
  getObb,
  registerCommand,
  unregisterCommand,
  isFrame,
  isLock,
  config,
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
    if (ancestor instanceof Element2D) {
      obbs.push(getObbInDrawboard(ancestor as Element2D))
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
      name: el.name,
      box: getObbInDrawboard(el),
    }
  })
})

const _selectionTransform = computed(() => {
  const zoom = camera.value.zoom
  return {
    ...getObbInDrawboard(elementSelection.value),
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
          ancestor instanceof Element2D
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
    : getObb(elementSelection.value)
  return `${Number(obb.width.toFixed(2))} × ${Number(obb.height.toFixed(2))}`
}

defineExpose({
  transformable,
})
</script>

<template>
  <div
    v-for="(obb, index) in parentObbs" :key="index"
    class="mce-parent-element-obb"
    :style="{
      borderColor: 'currentColor',
      ...boundingBoxToStyle(obb),
    }"
  />

  <div
    v-if="state === 'selecting'"
    class="mce-selected-area"
    :style="{
      borderColor: 'currentcolor',
      ...boundingBoxToStyle(props.selectedArea),
    }"
  />

  <div
    v-for="(item, index) in selectionObbs"
    :key="index"
    class="mce-element-obb"
    :style="{
      borderColor: 'currentcolor',
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
    class="mce-selection-obb"
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
      style="position: absolute;"
      :style="boundingBoxToStyle(selectionTransform)"
    >
      <slot :box="selectionTransform" />
    </div>
  </template>
</template>

<style lang="scss">
.mce-parent-element-obb {
  position: absolute;
  pointer-events: none;
  border-width: 1px;
  border-style: dashed;
  color: rgba(var(--mce-theme-primary), 1);
  opacity: .5;
}

.mce-selected-area {
  position: absolute;
  border-width: 1px;
  border-style: solid;
  color: rgba(var(--mce-theme-primary), 1);
  background-color: rgba(var(--mce-theme-primary), .1);
}

.mce-selection-obb {
  position: absolute;
  color: rgba(var(--mce-theme-primary), 1);
}

.mce-element-obb {
  position: absolute;
  border-width: 1px;
  border-style: solid;
  color: rgba(var(--mce-theme-primary), 1);
}
</style>

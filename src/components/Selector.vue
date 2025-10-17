<script setup lang="ts">
import type { AxisAlignedBoundingBox, OrientedBoundingBox } from '../types'
import { Element2D } from 'modern-canvas'
import { computed, onBeforeMount, onBeforeUnmount, useTemplateRef } from 'vue'
import { useEditor } from '../composables/editor'
import { boundingBoxToStyle } from '../utils/box'
import Transformable from './shared/Transformable.vue'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<{
  resizeStrategy?: 'free' | 'aspectRatio' | 'diagonalAspectRatio'
  selectedArea?: AxisAlignedBoundingBox
}>(), {
  selectedArea: () => ({ left: 0, top: 0, width: 0, height: 0 }),
})

const {
  state,
  resizeElement,
  selection,
  camera,
  obbToFit,
  getObbInDrawboard,
  getObb,
  registerCommand,
  unregisterCommand,
  isFrame,
  isLocked,
  config,
} = useEditor()

const transformable = useTemplateRef('transformableRef')

onBeforeMount(() => {
  registerCommand('startTransform', e => Boolean(transformable.value?.start(e)))
})

onBeforeUnmount(() => {
  unregisterCommand('startTransform')
})

const _currentObb = computed(() => getObbInDrawboard(selection.value))
const parentObbs = computed(() => {
  if (selection.value.length !== 1) {
    return []
  }
  const obbs: OrientedBoundingBox[] = []
  selection.value[0].forEachAncestor((ancestor) => {
    if (ancestor instanceof Element2D) {
      obbs.push(getObbInDrawboard(ancestor as Element2D))
    }
  })
  return obbs
})
const selectedElementBoxes = computed(() => {
  if (selection.value.length <= 1) {
    return []
  }
  return selection.value.map((el) => {
    return {
      name: el.name,
      box: getObbInDrawboard(el),
    }
  })
})
const currentObb = computed({
  get: () => _currentObb.value,
  set: (val: OrientedBoundingBox) => {
    const zoom = camera.value.zoom
    const oldBox = _currentObb.value
    const offsetBox = {
      left: Math.round((val.left - oldBox.left) / zoom.x),
      top: Math.round((val.top - oldBox.top) / zoom.y),
      width: Math.round((val.width - oldBox.width) / zoom.x),
      height: Math.round((val.height - oldBox.height) / zoom.y),
      rotate: Math.round(((val.rotate ?? 0) - (oldBox.rotate ?? 0))),
    }
    const handle: string = transformable.value?.activeHandle ?? 'move'
    selection.value.forEach((element) => {
      const style = element.style
      const box = {
        left: style.left + offsetBox.left,
        top: style.top + offsetBox.top,
        width: style.width + offsetBox.width,
        height: style.height + offsetBox.height,
        rotate: style.rotate + offsetBox.rotate,
      }
      if (!handle.startsWith('rotate')) {
        if (handle.startsWith('resize')) {
          resizeElement(
            element,
            box.width / element.style.width,
            box.height / element.style.height,
            isFrame(element)
              ? undefined
              : handle.split('-').length > 2
                ? { deep: true, textFontSizeToFit: true }
                : { deep: true, textToFit: true },
          )
          box.width = element.style.width
          box.height = element.style.height
        }
      }
      Object.assign(style, box)
      element.updateGlobalTransform()
      element.forEachAncestor((ancestor) => {
        if (
          ancestor instanceof Element2D
          && !isFrame(ancestor)
        ) {
          obbToFit(ancestor)
        }
      })
    })
  },
})

function getTipText(type: 'resize' | 'rotate') {
  const obb = selection.value.length === 1
    ? selection.value[0].style
    : getObb(selection.value)

  if (type === 'rotate') {
    return `${Math.floor(obb.rotate ?? 0)}°`
  }
  else {
    return `${Math.floor(obb.width)} x ${Math.floor(obb.height)}`
  }
}

defineExpose({
  transformable,
})
</script>

<template>
  <div
    v-for="(obb, index) in parentObbs" :key="index"
    class="mce-parent-element-box"
    :style="{
      borderColor: 'currentColor',
      ...boundingBoxToStyle(obb),
    }"
  />

  <div
    v-if="state === 'selecting'"
    class="mce-select-range-box"
    :style="{
      borderColor: 'currentcolor',
      ...boundingBoxToStyle(props.selectedArea),
    }"
  />

  <template v-if="!state || state === 'selecting'">
    <div
      v-for="(item, index) in selectedElementBoxes"
      :key="index"
      class="mce-selected-element-box"
      :data-name="item.name"
      :style="{
        borderColor: 'currentcolor',
        ...boundingBoxToStyle(item.box),
      }"
    />
  </template>

  <Transformable
    v-if="currentObb.width && currentObb.height"
    ref="transformableRef"
    v-model="currentObb"
    :visibility="state !== 'selecting' ? 'auto' : 'none'"
    :moveable="selection[0] && !isLocked(selection[0])"
    :resize-strategy="props.resizeStrategy"
    :handle-shape="config.handleShape"
    handle-strategy="point"
    class="mce-current-box"
    :border-style="selection.length > 1 ? 'dashed' : 'solid'"
    :get-tip-text="getTipText"
    @move="() => !state && (state = 'transforming')"
    @end="() => state === 'transforming' && (state = undefined)"
  >
    <template v-if="$slots.transformable" #svg="slotProps">
      <slot name="transformable" v-bind="slotProps" />
    </template>
  </Transformable>

  <template v-if="currentObb.width && currentObb.height && $slots.default">
    <div
      style="position: absolute;"
      :style="boundingBoxToStyle(currentObb)"
    >
      <slot :box="currentObb" />
    </div>
  </template>
</template>

<style lang="scss">
.mce-parent-element-box {
  position: absolute;
  pointer-events: none;
  border-width: 1px;
  border-style: dashed;
  color: rgba(var(--mce-theme-primary), 1);
  opacity: .5;
}

.mce-select-range-box {
  position: absolute;
  border-width: 1px;
  border-style: solid;
  color: rgba(var(--mce-theme-primary), 1);
  background-color: rgba(var(--mce-theme-primary), .1);
}

.mce-current-box {
  position: absolute;
  color: rgba(var(--mce-theme-primary), 1);
}

.mce-selected-element-box {
  position: absolute;
  border-width: 1px;
  border-style: solid;
  color: rgba(var(--mce-theme-primary), 1);
}
</style>

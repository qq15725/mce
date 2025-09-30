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
  setState,
  selectedElements,
  camera,
  activeElement,
  obbToFit,
  getObbInDrawboard,
  getObb,
  registerCommand,
  unregisterCommand,
  isFrame,
  isLockedElement,
  currentElements,
} = useEditor()

const transformable = useTemplateRef('transformableRef')

onBeforeMount(() => {
  registerCommand('startTransform', e => Boolean(transformable.value?.start(e)))
})

onBeforeUnmount(() => {
  unregisterCommand('startTransform')
})

const _activeObb = computed(() => getObbInDrawboard(activeElement.value ?? selectedElements.value))
const parentObbs = computed(() => {
  const obbs: OrientedBoundingBox[] = []
  activeElement.value?.forEachAncestor((ancestor) => {
    if (ancestor instanceof Element2D) {
      obbs.push(getObbInDrawboard(ancestor as Element2D))
    }
  })
  return obbs
})
const selectedElementBoxes = computed(() => {
  return selectedElements.value.map((el) => {
    return {
      name: el.name,
      box: getObbInDrawboard(el),
    }
  })
})
const activeObb = computed({
  get: () => _activeObb.value,
  set: (val: OrientedBoundingBox) => {
    const oldBox = _activeObb.value
    const offsetBox = {
      left: (val.left - oldBox.left),
      top: (val.top - oldBox.top),
      width: (val.width - oldBox.width),
      height: (val.height - oldBox.height),
      rotate: ((val.rotate ?? 0) - (oldBox.rotate ?? 0)),
    }
    const handle: string = transformable.value?.activeHandle ?? 'move'
    currentElements.value.forEach((element) => {
      const style = element.style
      const zoom = camera.value.zoom.x
      const box = {
        left: style.left + offsetBox.left / zoom,
        top: style.top + offsetBox.top / zoom,
        width: style.width + offsetBox.width / zoom,
        height: style.height + offsetBox.height / zoom,
        rotate: style.rotate + offsetBox.rotate,
      }
      if (!handle.startsWith('rotate')) {
        if (handle.startsWith('resize')) {
          resizeElement(element, box.width, box.height, handle.split('-').length > 2)
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
  const obb = activeElement.value?.style ?? getObb(selectedElements.value)
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
    ref="transformableRef"
    v-model="activeObb"
    :visibility="state !== 'selecting' ? 'auto' : 'none'"
    :moveable="activeElement && !isLockedElement(activeElement)"
    :resize-strategy="props.resizeStrategy"
    handle-strategy="point"
    class="mce-element-box"
    :border-style="selectedElements.length ? 'dashed' : 'solid'"
    :get-tip-text="getTipText"
    @move="() => !state && setState('transforming')"
    @end="() => state === 'transforming' && setState(undefined)"
  >
    <template #svg="slotProps">
      <slot name="transformable-svg" v-bind="slotProps" />
    </template>
  </Transformable>

  <template v-if="activeElement">
    <slot :obb="activeObb" />
  </template>
</template>

<style lang="scss">
.mce-parent-element-box {
  position: absolute;
  pointer-events: none;
  border-width: 2px;
  border-style: dashed;
  color: rgba(var(--mce-theme-primary), 1);
  opacity: .5;
}

.mce-select-range-box {
  position: absolute;
  border-width: 2px;
  border-style: solid;
  color: rgba(var(--mce-theme-primary), 1);
  background-color: rgba(var(--mce-theme-primary), .1);
}

.mce-element-box {
  position: absolute;
  color: rgba(var(--mce-theme-primary), 1);
}

.mce-selected-element-box {
  position: absolute;
  border-width: 2px;
  border-style: solid;
  color: rgba(var(--mce-theme-primary), 1);
}
</style>

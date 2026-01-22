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
  getObb,
  getAabb,
  registerCommand,
  unregisterCommand,
  inEditorIs,
  isLock,
  config,
  snapThreshold,
  getSnapPoints,
  hoverElement,
  selectionAabb,
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
    handle: (transformable.value?.activeHandle ?? 'move') as Mce.TransformHandle,
    elements: elementSelection.value,
  }
}

const startContext = {
  rotate: 0,
  offsetMap: {} as Record<number, { x: number, y: number }>,
}

function onStart() {
  startContext.rotate = 0
  const aabb = selectionAabb.value
  elementSelection.value.forEach((el) => {
    const elAabb = el.getGlobalAabb()
    startContext.offsetMap[el.instanceId] = {
      x: (elAabb.x - aabb.x) / aabb.width,
      y: (elAabb.y - aabb.y) / aabb.height,
    }
  })
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
      rotate: (val.rotate ?? 0),
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

    const els = elementSelection.value

    if (els.length > 1) {
      if (handle.startsWith('rotate')) {
        offsetStyle.rotate = transform.rotate - startContext.rotate
        startContext.rotate += offsetStyle.rotate
      }
    }

    els.forEach((el) => {
      const style = el.style

      const newStyle = {
        left: style.left + offsetStyle.left,
        top: style.top + offsetStyle.top,
        width: style.width + offsetStyle.width,
        height: style.height + offsetStyle.height,
        rotate: (style.rotate + offsetStyle.rotate + 360) % 360,
        borderRadius: Math.round(style.borderRadius + offsetStyle.borderRadius),
      }

      if (handle.startsWith('rotate')) {
        newStyle.rotate = Math.round(newStyle.rotate * 100) / 100
      }
      else if (handle.startsWith('resize')) {
        const scale = newStyle.rotate ? 100 : 1
        const newWidth = Math.max(1, Math.round(newStyle.width * scale) / scale)
        const newHeight = Math.max(1, Math.round(newStyle.height * scale) / scale)
        const shape = el.shape
        resizeElement(
          el,
          newWidth,
          newHeight,
          inEditorIs(el, 'Frame')
            ? undefined
            : shape.isValid()
              ? { deep: true }
              : handle.split('-')[1].length > 1
                ? { deep: true, textFontSizeToFit: true }
                : { deep: true, textToFit: true },
        )
        newStyle.width = el.style.width
        newStyle.height = el.style.height
      }

      Object.assign(style, newStyle)

      el.updateGlobalTransform()
    })

    if (els.length > 1) {
      if (handle.startsWith('resize')) {
        const selectionAabb = getAabb(els)
        els.forEach((el) => {
          const parentAabb = el.getParent<Element2D>()?.getGlobalAabb?.() ?? new Aabb2D()
          const { x, y } = startContext.offsetMap[el.instanceId]!
          el.style.left = selectionAabb.left - parentAabb.left + selectionAabb.width * x
          el.style.top = selectionAabb.top - parentAabb.left + selectionAabb.height * y
        })
      }
    }

    emit('selectionTransform', createSelectionTransformContext())
  },
})

const movable = computed(() => {
  return state.value !== 'typing'
    && elementSelection.value.every((element) => {
      return !isLock(element)
        && element.meta.movable !== false
        && element.meta.transformable !== false
    })
})

const resizable = computed(() => {
  return state.value !== 'typing'
    && elementSelection.value.every((element) => {
      return !isLock(element)
        && element.meta.resizable !== false
        && element.meta.transformable !== false
    })
})

const rotatable = computed(() => {
  return state.value !== 'typing'
    && elementSelection.value.every((element) => {
      return !isLock(element)
        && element.meta.rotatable !== false
        && element.meta.transformable !== false
    })
})

const roundable = computed(() => {
  if (
    state.value !== 'typing'
    && elementSelection.value.length === 1
  ) {
    const element = elementSelection.value[0]
    return hoverElement.value?.equal(element)
      && !isLock(element)
      && element.foreground.isValid()
  }
  return false
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
  <div class="mce-selector">
    <div
      v-for="(style, index) in parentObbStyles" :key="index"
      class="mce-selector__parent"
      :style="{
        borderColor: 'currentColor',
        ...style,
      }"
    />

    <template
      v-if="state !== 'transforming'"
    >
      <div
        v-for="(style, index) in selectionObbStyles"
        :key="index"
        class="mce-selector__node"
        :style="{
          borderColor: 'currentcolor',
          ...style,
        }"
      />
    </template>

    <div
      v-if="state === 'selecting'"
      class="mce-selector__area"
      :style="{
        borderColor: 'currentcolor',
        ...props.selectedArea.toCssStyle(),
      }"
    />

    <TransformControls
      v-if="transform.width && transform.height"
      ref="transformableTpl"
      v-bind="config.transformControls"
      v-model="transform"
      :movable="movable"
      :resizable="resizable"
      :rotatable="rotatable"
      :roundable="roundable"
      :resize-strategy="props.resizeStrategy"
      class="mce-selector__transform"
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
  </div>
</template>

<style lang="scss">
  .mce-selector {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;

    &__slot {
      position: absolute;
    }

    &__parent {
      position: absolute;
      pointer-events: none;
      border-width: 1px;
      border-style: dashed;
      color: rgba(var(--mce-theme-primary), 1);
      opacity: .5;
    }

    &__area {
      position: absolute;
      border-width: 1px;
      border-style: solid;
      color: rgba(var(--mce-theme-primary), 1);
      background-color: rgba(var(--mce-theme-primary), .1);
    }

    &__transform {
      position: absolute;
      color: rgba(var(--mce-theme-primary), 1);
    }

    &__node {
      position: absolute;
      border-width: 1px;
      border-style: solid;
      color: rgba(var(--mce-theme-primary), 1);
    }
  }
</style>

<script setup lang="ts">
import type { Element2D, Obb2D } from 'modern-canvas'
import { computed, onBeforeMount, onBeforeUnmount, useTemplateRef } from 'vue'
import { defaultResizeStrategy } from '../composables'
import { useEditor } from '../composables/editor'
import ForegroundCropper from './ForegroundCropper.vue'
import Transform from './shared/Transform.vue'

const {
  emit,
  isElement,
  exec,
  state,
  selection,
  selectionMarquee,
  elementSelection,
  selectionObb,
  selectionObbInDrawboard,
  camera,
  getObb,
  registerCommand,
  unregisterCommand,
  isLock,
  getConfigRef,
  hoverElement,
} = useEditor()

const transformConfig = getConfigRef<Mce.TransformConfig>('interaction.transform')
const transform = useTemplateRef('transformTpl')
const resizeStrategy = computed(() => {
  let val: any
  if (elementSelection.value.length === 1) {
    const el = elementSelection.value[0]
    if (el) {
      if (el.text.isValid()) {
        val = 'lockAspectRatioDiagonal'
      }
      else {
        val = defaultResizeStrategy(el)
      }
    }
  }
  if (val === 'lockAspectRatio') {
    val = transformConfig.value.resizeStrategy
  }
  return val
})

onBeforeMount(() => {
  registerCommand({
    command: 'startTransform',
    handle: (event) => {
      Boolean(transform.value?.start(event))
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

function onStart(ctx: Mce.TransformContext): void {
  emit('selectionTransformStart', ctx)
}

function onMove(ctx: Mce.TransformMoveContext) {
  if (!state.value) {
    state.value = ctx.handle === 'move' ? 'moving' : 'transforming'
  }
  emit('selectionTransform', ctx)
}

function onEnd(ctx: Mce.TransformContext) {
  if (state.value === 'moving' || state.value === 'transforming') {
    state.value = undefined
  }
  emit('selectionTransformEnd', ctx)
}

const transformValue = computed(() => exec('getTransform'))

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

function tip() {
  const obb = elementSelection.value.length === 1
    ? elementSelection.value[0].style
    : selectionObb.value
  return `${Number(obb.width.toFixed(2))} × ${Number(obb.height.toFixed(2))}`
}

defineExpose({
  transform,
})
</script>

<template>
  <div class="mce-selection">
    <div
      v-for="(style, index) in parentObbStyles" :key="index"
      class="mce-selection__parent"
      :style="style"
    />

    <template
      v-if="state !== 'moving' && state !== 'transforming'"
    >
      <div
        v-for="(style, index) in selectionObbStyles"
        :key="index"
        class="mce-selection__node"
        :style="style"
      />
    </template>

    <div
      v-if="state === 'selecting' || state === 'painting'"
      class="mce-selection__marquee"
      :style="selectionMarquee.toCssStyle()"
    />

    <template v-if="transformValue.width && transformValue.height">
      <div
        class="mce-selection__slot"
        :style="selectionObbInDrawboard.toCssStyle()"
      >
        <ForegroundCropper>
          <template #default="scope">
            <slot name="foreground-cropper" v-bind="scope" />
          </template>
        </ForegroundCropper>

        <slot />
      </div>
    </template>

    <Transform
      v-if="transformValue.width && transformValue.height"
      ref="transformTpl"
      v-bind="transformConfig"
      :model-value="transformValue"
      :movable="movable"
      :resizable="resizable"
      :rotatable="rotatable"
      :roundable="roundable"
      :resize-strategy="resizeStrategy"
      :ui="state !== 'moving'"
      :border-style="state === 'cropping' ? 'dashed' : 'solid'"
      class="mce-selection__transform"
      :tip="tip"
      :scale="[camera.zoom.x, camera.zoom.y]"
      :offset="[-camera.position.x, -camera.position.y]"
      @start="onStart"
      @move="onMove"
      @end="onEnd"
    >
      <template v-if="$slots.transform" #svg>
        <slot name="transform" />
      </template>
    </Transform>
  </div>
</template>

<style lang="scss">
  .mce-selection {
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
      border-color: currentColor;
    }

    &__marquee {
      position: absolute;
      border-width: 1px;
      border-style: solid;
      color: rgba(var(--mce-theme-primary), 1);
      background-color: rgba(var(--mce-theme-primary), .1);
      border-color: currentcolor;
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
      border-color: currentcolor;
    }
  }
</style>

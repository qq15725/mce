<script setup lang="ts">
import type { Element2D } from 'modern-canvas'
import { computed, onBeforeMount, onBeforeUnmount, useTemplateRef } from 'vue'
import { useEditor } from '../composables/editor'
import ForegroundCropper from './ForegroundCropper.vue'
import PathEditor from './PathEditor.vue'
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
  isContentEditing,
  readonly,
} = useEditor()

const transformConfig = getConfigRef<Mce.TransformConfig>('interaction.transform')
const transform = useTemplateRef('transformTpl')
const transformProps = computed(() => {
  const els = elementSelection.value
  const props: Record<string, any> = { ...transformConfig.value }
  if (els.length === 1) {
    const el = elementSelection.value[0]
    if (el) {
      if (el.text.isValid()) {
        props.resizeStrategy = 'lockAspectRatio'
        props.lockAspectRatioStrategy = 'diagonal'
      }
      else {
        if (el.meta.lockAspectRatio) {
          props.resizeStrategy = 'lockAspectRatio'
        }
      }
    }
  }
  else if (els.length > 1) {
    props.resizeStrategy = 'lockAspectRatio'
    props.lockAspectRatioStrategy = 'diagonal'
  }
  return props
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
  const result: { id: number, style: Record<string, any> }[] = []
  selection.value[0]?.findAncestor((ancestor) => {
    if (isElement(ancestor)) {
      const el = ancestor as Element2D
      result.push({ id: el.instanceId, style: getObb(el, 'drawboard').toCssStyle() })
    }
    return false
  })
  return result
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
      id: el.instanceId,
      style: {
        ...box.toCssStyle(),
        borderRadius: `${(el.style.borderRadius ?? 0) * camera.value.zoom.x}px`,
      },
    }
  })
})

function onStart(ctx: Mce.TransformContext): void {
  emit('selectionTransformStarted', ctx)
}

function onMove(ctx: Mce.TransformContext) {
  if (!state.value) {
    state.value = ctx.handle === 'move' ? 'moving' : 'transforming'
  }
  emit('selectionTransformed', ctx)
}

function onEnd(ctx: Mce.TransformContext) {
  if (state.value === 'moving' || state.value === 'transforming') {
    state.value = undefined
  }
  emit('selectionTransformEnded', ctx)
}

const transformValue = computed(() => exec('getTransform'))

// A pure connection line is positioned/sized by its route, so the box
// move/resize/rotate handles are meaningless — suppress them.
const isConnection = computed(() => {
  return elementSelection.value.length === 1
    && Boolean((elementSelection.value[0] as any).connection?.isValid())
})

const movable = computed(() => {
  return !readonly.value
    && state.value !== 'typing'
    && !isContentEditing()
    && !isConnection.value
    && elementSelection.value.every((element) => {
      return !isLock(element)
        && element.meta.movable !== false
        && element.meta.transformable !== false
    })
})

const resizable = computed(() => {
  return !readonly.value
    && state.value !== 'typing'
    && !isContentEditing()
    && !isConnection.value
    && elementSelection.value.every((element) => {
      return !isLock(element)
        && element.meta.resizable !== false
        && element.meta.transformable !== false
    })
})

const rotatable = computed(() => {
  return !readonly.value
    && state.value !== 'typing'
    && !isContentEditing()
    && !isConnection.value
    && elementSelection.value.every((element) => {
      return !isLock(element)
        && element.meta.rotatable !== false
        && element.meta.transformable !== false
    })
})

const roundable = computed(() => {
  if (
    !readonly.value
    && state.value !== 'typing'
    && !isContentEditing()
    && !isConnection.value
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
  // 必须读 el.style.width/height 建立响应式依赖——el.size 是非响应式 getter，
  // 只用它时尺寸变化标签不会更新。style 为 'auto'/百分比等非数字时回退到 size。
  if (elementSelection.value.length === 1) {
    const el = elementSelection.value[0]
    const sw = el.style.width
    const sh = el.style.height
    const w = typeof sw === 'number' ? sw : el.size.width
    const h = typeof sh === 'number' ? sh : el.size.height
    return `${Number(w.toFixed(2))} × ${Number(h.toFixed(2))}`
  }
  const obb = selectionObb.value
  return `${Number(obb.width.toFixed(2))} × ${Number(obb.height.toFixed(2))}`
}

defineExpose({
  transform,
})
</script>

<template>
  <div class="m-selection">
    <div
      v-for="item in parentObbStyles" :key="item.id"
      class="m-selection__parent"
      :style="item.style"
    />

    <template
      v-if="state !== 'moving' && state !== 'transforming'"
    >
      <div
        v-for="item in selectionObbStyles"
        :key="item.id"
        class="m-selection__node"
        :style="item.style"
      />
    </template>

    <div
      v-if="state === 'selecting' || state === 'painting'"
      class="m-selection__marquee"
      :style="selectionMarquee.toCssStyle()"
    />

    <template v-if="transformValue.width && transformValue.height">
      <div
        class="m-selection__slot"
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

    <PathEditor
      v-if="state === 'pathEditing' && elementSelection.length === 1"
      :element="elementSelection[0]"
      :scale="[camera.zoom.x, camera.zoom.y]"
      :offset="[-camera.position.x, -camera.position.y]"
      @end="state = undefined"
    />

    <Transform
      v-if="transformValue.width && transformValue.height && state !== 'pathEditing'"
      ref="transformTpl"
      v-bind="transformProps"
      :model-value="transformValue"
      :movable="movable"
      :resizable="resizable"
      :rotatable="rotatable"
      :roundable="roundable"
      :ui="state !== 'moving'"
      :border-style="state === 'cropping' ? 'dashed' : 'solid'"
      class="m-selection__transform"
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
  .m-selection {
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
      color: rgba(var(--m-theme-primary), 1);
      opacity: .5;
      border-color: currentColor;
    }

    &__marquee {
      position: absolute;
      border-width: 1px;
      border-style: solid;
      color: rgba(var(--m-theme-primary), 1);
      background-color: rgba(var(--m-theme-primary), .1);
      border-color: currentcolor;
    }

    &__transform {
      position: absolute;
      color: rgba(var(--m-theme-primary), 1);
    }

    &__node {
      position: absolute;
      border-width: 1px;
      border-style: solid;
      color: rgba(var(--m-theme-primary), 1);
      border-color: currentcolor;
    }
  }
</style>

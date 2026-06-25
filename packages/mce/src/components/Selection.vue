<script setup lang="ts">
import type { Element2D } from 'modern-canvas'
import { computed, onBeforeMount, onBeforeUnmount, useTemplateRef } from 'vue'
import { useEditor } from '../composables/editor'
import { getLineEndpoints, parseLineShape } from '../utils'
import ForegroundCropper from './ForegroundCropper.vue'
import LineEditor from './LineEditor.vue'
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

// 线/箭头(parseLineShape)与工作流连线(connection)都沿自身高亮，不画矩形包围盒。
function hasLineVisual(el: any): boolean {
  return Boolean(parseLineShape(el) || el?.connection?.isValid?.())
}

const selectionObbStyles = computed(() => {
  if (
    state.value !== 'selecting'
    && elementSelection.value.length === 1
  ) {
    return []
  }

  // 线类（直线/箭头/连线）走沿线高亮（见 selectionLinePaths），其余元素照常画 obb 框
  return elementSelection.value.filter(el => !hasLineVisual(el)).map((el) => {
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

// 把全局坐标映射到画板像素的 SVG 变换；配合 vector-effect 让描边宽度不随缩放变化。
const cameraTransform = computed(() => {
  const { zoom, position } = camera.value
  return `translate(${-position.x} ${-position.y}) scale(${zoom.x} ${zoom.y})`
})

// 沿线高亮的 path（全局坐标，由 cameraTransform 映射到屏幕）：
// - 连线(connection)：用 connection.route() 的实际路由路径（直线/折线/曲线），任何选中态都画；
// - 直线/箭头：单选非框选时交给 LineEditor 端点编辑，这里只在框选/多选时画。
const selectionLinePaths = computed(() => {
  if (state.value === 'moving' || state.value === 'transforming') {
    return []
  }
  const single = elementSelection.value.length === 1
  const result: { id: number, d: string }[] = []
  for (const el of elementSelection.value) {
    const conn = (el as any).connection
    if (conn?.isValid?.()) {
      const d = conn.route?.()?.toData?.()
      if (d) {
        result.push({ id: el.instanceId, d })
      }
      continue
    }
    if (single && state.value !== 'selecting') {
      continue
    }
    const eps = getLineEndpoints(el)
    if (eps) {
      result.push({ id: el.instanceId, d: `M ${eps[0].x} ${eps[0].y} L ${eps[1].x} ${eps[1].y}` })
    }
  }
  return result
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

// A straight line / arrow gets a Figma-style endpoint editor instead of the
// rectangular box (resize/rotate handles + W×H tip make no sense for a line).
// Detected purely from the shape geometry so it also covers imported/synced
// data that never carried a creation-time marker.
const isLineLike = computed(() => {
  return elementSelection.value.length === 1
    && Boolean(parseLineShape(elementSelection.value[0]))
})

const movable = computed(() => {
  return state.value !== 'typing'
    && !isContentEditing()
    && !isConnection.value
    && elementSelection.value.every((element) => {
      return !isLock(element)
        && element.meta.movable !== false
        && element.meta.transformable !== false
    })
})

const resizable = computed(() => {
  return state.value !== 'typing'
    && !isContentEditing()
    && !isConnection.value
    && elementSelection.value.every((element) => {
      return !isLock(element)
        && element.meta.resizable !== false
        && element.meta.transformable !== false
    })
})

const rotatable = computed(() => {
  return state.value !== 'typing'
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
    state.value !== 'typing'
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
      <svg
        v-if="selectionLinePaths.length"
        class="m-selection__lines"
        :style="{ overflow: 'visible' }"
      >
        <path
          v-for="item in selectionLinePaths"
          :key="item.id"
          class="m-selection__line"
          :d="item.d"
          :transform="cameraTransform"
          vector-effect="non-scaling-stroke"
        />
      </svg>
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

    <LineEditor
      v-if="!readonly && isLineLike && state !== 'pathEditing' && state !== 'cropping'"
      :key="elementSelection[0].instanceId"
      :element="elementSelection[0]"
      :scale="[camera.zoom.x, camera.zoom.y]"
      :offset="[-camera.position.x, -camera.position.y]"
    />

    <Transform
      v-if="!readonly && !isLineLike && !isConnection && transformValue.width && transformValue.height && state !== 'pathEditing'"
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

    &__lines {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      color: rgba(var(--m-theme-primary), 1);
    }

    &__line {
      fill: none;
      stroke: currentColor;
      stroke-width: 1.5;
    }
  }
</style>

<script setup lang="ts">
import type { Element2D } from 'modern-canvas'
import { computed, onBeforeMount, onBeforeUnmount, useTemplateRef } from 'vue'
import { useEditor } from '../composables/editor'
import { getLineEndpoints, parseLineShape } from '../utils'
import { overflowClips } from '../utils/overlayClip'
import ForegroundCropper from './ForegroundCropper.vue'
import { Icon } from './icon'
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
  setLock,
  getConfigRef,
  hoverElement,
  isContentEditing,
  readonly,
  mode,
  getAabb,
  getAncestorFrame,
  drawboardAabb,
  t,
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

  // 线类（直线/箭头/连线）走沿线高亮（见 selectionLinePaths），其余元素照常画 obb 框；
  // 锁定元素改画红框（见 lockedBoxes），此处排除。
  return elementSelection.value.filter(el => !hasLineVisual(el) && !isLock(el)).map((el) => {
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

// 选区是否含锁定元素（锁定只能单选，故等价于「当前选中的就是一个锁定元素」）。
const isSelectionLocked = computed(() => elementSelection.value.some(el => isLock(el)))

// 锁定元素：红框 + 右下角解锁图标。图标定位到旋转后包围盒的右下角顶点，但自身保持直立。
const lockedBoxes = computed(() => {
  return elementSelection.value.filter(el => isLock(el)).map((el) => {
    const box = getObb(el, 'drawboard')
    const cos = Math.cos(box.rotation)
    const sin = Math.sin(box.rotation)
    const cx = box.left + box.width / 2
    const cy = box.top + box.height / 2
    return {
      id: el.instanceId,
      style: {
        ...box.toCssStyle(),
        borderRadius: `${(el.style.borderRadius ?? 0) * camera.value.zoom.x}px`,
      },
      icon: {
        left: `${cx + (box.width / 2) * cos - (box.height / 2) * sin}px`,
        top: `${cy + (box.width / 2) * sin + (box.height / 2) * cos}px`,
      },
    }
  })
})

function unlock(instanceId: number): void {
  const el = elementSelection.value.find(e => e.instanceId === instanceId)
  if (el) {
    setLock(el, false)
  }
}

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
      // 工作流模式下选中连线由引擎侧流动高亮(useConnectionFlow)反馈，不再叠 SVG 蓝线。
      if (mode.value === 'workflow') {
        continue
      }
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

// 单选元素落在可滚动画板内时，把选框(含手柄)裁到画板可见区，避免溢出画板外。
// 裁剪挂在无变换的全覆盖 wrapper 上（Transform 根带旋转/位移，直接裁无法对齐画板矩形）。
const selectionClip = computed<string | undefined>(() => {
  if (elementSelection.value.length !== 1) {
    return undefined
  }
  const el = elementSelection.value[0]
  const frame = getAncestorFrame(el)
  if (!frame || !overflowClips(frame)) {
    return undefined
  }
  const fr = getAabb(frame, 'drawboard')
  const { width: W, height: H } = drawboardAabb.value
  return `inset(${fr.top}px ${W - (fr.left + fr.width)}px ${H - (fr.top + fr.height)}px ${fr.left}px)`
})

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

    <!-- 锁定元素：红框 + 右下角解锁图标（点击解除锁定） -->
    <template v-for="item in lockedBoxes" :key="item.id">
      <div class="m-selection__locked" :style="item.style" />
      <button
        type="button"
        class="m-selection__unlock"
        :style="item.icon"
        :title="t('clickToUnlock')"
        @pointerdown.stop
        @click.stop="unlock(item.id)"
      >
        <Icon icon="$lock" />
        <span class="m-selection__unlock-tip">{{ t('clickToUnlock') }}</span>
      </button>
    </template>

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
      v-if="!readonly && !isSelectionLocked && isLineLike && state !== 'pathEditing' && state !== 'cropping'"
      :key="elementSelection[0].instanceId"
      :element="elementSelection[0]"
      :scale="[camera.zoom.x, camera.zoom.y]"
      :offset="[-camera.position.x, -camera.position.y]"
    />

    <div
      v-if="!readonly && !isSelectionLocked && !isLineLike && !isConnection && transformValue.width && transformValue.height && state !== 'pathEditing'"
      class="m-selection__clip"
      :style="{ clipPath: selectionClip }"
    >
      <Transform
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

    // 选框裁剪层：无变换、覆盖整个 drawboard，clip-path 把内部选框裁到画板可见区。
    &__clip {
      position: absolute;
      inset: 0;
      pointer-events: none;
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

    // 锁定元素：红色包围盒
    &__locked {
      position: absolute;
      border-width: 1.5px;
      border-style: solid;
      border-color: #f03e3e;
    }

    // 解锁图标：黑色圆形按钮，定位到红框右下角顶点、直立不随元素旋转
    &__unlock {
      position: absolute;
      z-index: 1;
      transform: translate(-50%, -50%);
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      padding: 0;
      border: none;
      border-radius: 50%;
      background: #1a1a1a;
      color: #fff;
      font-size: 15px;
      cursor: pointer;
      pointer-events: auto;
      box-shadow: 0 2px 8px rgba(0, 0, 0, .3);

      &:hover {
        background: #000;
      }

      &:hover &-tip {
        opacity: 1;
      }
    }

    // 悬浮解锁按钮时的深色气泡提示
    &__unlock-tip {
      position: absolute;
      top: calc(100% + 8px);
      left: 50%;
      transform: translateX(-50%);
      padding: 6px 10px;
      border-radius: 6px;
      background: rgba(38, 38, 38, .92);
      color: #fff;
      font-size: 12px;
      line-height: 1;
      white-space: nowrap;
      pointer-events: none;
      opacity: 0;
      transition: opacity .12s;

      &::before {
        content: '';
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%);
        border: 5px solid transparent;
        border-bottom-color: rgba(38, 38, 38, .92);
      }
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

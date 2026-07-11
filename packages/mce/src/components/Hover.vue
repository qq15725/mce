<script setup lang="ts">
import { computed, watch } from 'vue'
import { useEditor } from '../composables/editor'
import { getLineEndpoints } from '../utils'
import { frameClipPath } from '../utils/overlayClip'

const {
  selection,
  hoverElement,
  getObb,
  getAabb,
  getAncestorFrame,
  camera,
  mode,
} = useEditor()

watch(selection, () => hoverElement.value = undefined)

const show = computed(() =>
  hoverElement.value && !selection.value.some(node => node.equal(hoverElement.value!)),
)

// 线/箭头/连线沿自身高亮（而非矩形包围盒）：连线用路由路径，直线/箭头用两端点连线。
const hoverLinePath = computed<string | null>(() => {
  const el = hoverElement.value
  if (!el) {
    return null
  }
  const conn = (el as any).connection
  if (conn?.isValid?.()) {
    // 工作流模式下连线的 hover 由引擎侧流动高亮(useConnectionFlow)反馈，不再叠 SVG 蓝线。
    if (mode.value === 'workflow') {
      return null
    }
    return conn.route?.()?.toData?.() ?? null
  }
  const eps = getLineEndpoints(el)
  return eps ? `M ${eps[0].x} ${eps[0].y} L ${eps[1].x} ${eps[1].y}` : null
})

// 工作流连线：hover 不画任何覆盖（蓝线已抑制，也不落到矩形框分支——它没有有意义的包围盒）。
const isWorkflowConnection = computed(() =>
  mode.value === 'workflow'
  && Boolean((hoverElement.value as any)?.connection?.isValid?.()),
)

// 全局坐标→画板像素的 SVG 变换（配合 vector-effect 让描边宽度不随缩放变化）。
const cameraTransform = computed(() => {
  const { zoom, position } = camera.value
  return `translate(${-position.x} ${-position.y}) scale(${zoom.x} ${zoom.y})`
})

const hoverElementObb = computed(() => getObb(hoverElement.value, 'drawboard'))

// 元素在可滚动画板内时，把 hover 框裁到画板可见区，避免溢出到画板外。
const clipPath = computed(() =>
  frameClipPath(
    hoverElement.value,
    hoverElementObb.value,
    getAncestorFrame,
    frame => getAabb(frame, 'drawboard'),
  ),
)
</script>

<template>
  <svg
    v-if="show && hoverLinePath"
    class="m-hover-line"
    :style="{ overflow: 'visible' }"
  >
    <path
      class="m-hover-line__path"
      :d="hoverLinePath"
      :transform="cameraTransform"
      vector-effect="non-scaling-stroke"
    />
  </svg>

  <div
    v-else-if="show && !isWorkflowConnection"
    class="m-hover"
    :data-name="hoverElement?.name"
    :style="{
      borderColor: 'currentcolor',
      borderRadius: `${(hoverElement?.style?.borderRadius ?? 0) * camera.zoom.x}px`,
      ...hoverElementObb.toCssStyle(),
      clipPath,
    }"
  />
</template>

<style lang="scss">
.m-hover {
  position: absolute;
  border-style: solid;
  border-width: 2px;
  color: rgba(var(--m-theme-primary), 1);
}

.m-hover-line {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  color: rgba(var(--m-theme-primary), 1);

  &__path {
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
  }
}
</style>

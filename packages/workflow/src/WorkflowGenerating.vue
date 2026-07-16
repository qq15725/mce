<script lang="ts" setup>
import type { Aabb2D, Element2D } from 'modern-canvas'
import { useEditor } from 'mce'
import { computed } from 'vue'

// 「生成中」覆盖层：对每个被 setWorkflowGenerating 标记的节点，在其屏幕矩形上盖一层流动 shimmer。
// DOM 覆盖层（非 canvas）：浏览器自驱动画、不侵入文档/导出，且可经 slot / CSS 变量完全自定义。
const { getAabb, drawboardAabb, camera, getNodeById } = useEditor()
const generating = (useEditor() as any).workflowGenerating as Set<string> | undefined

const CULL_MARGIN = 64

function inViewport(a: Aabb2D): boolean {
  const { width, height } = drawboardAabb.value
  return a.left + a.width > -CULL_MARGIN
    && a.left < width + CULL_MARGIN
    && a.top + a.height > -CULL_MARGIN
    && a.top < height + CULL_MARGIN
}

// 生成中节点 + 其屏幕盒。读响应式 generating 集合 + camera（缩放/平移），随之更新。
const items = computed(() => {
  if (!generating?.size) {
    return []
  }
  const zoom = camera.value.zoom.x
  return [...generating]
    .map(id => getNodeById(id) as Element2D | undefined)
    .filter((n): n is Element2D => Boolean(n?.toGlobal))
    .map((node) => {
      const box = getAabb(node, 'drawboard')
      // 节点圆角是画布单位（workflow 节点默认 32），屏幕圆角随缩放。
      const radius = ((node.style as any)?.json?.borderRadius ?? 32) * zoom
      return { node, box, radius }
    })
    .filter(({ box }) => box.width > 1 && inViewport(box))
})

// transform 定位（只走合成，不触发重排），与 NodeLabel 一致。
function boxStyle(box: Aabb2D, radius: number): Record<string, string> {
  return {
    transform: `translate(${box.left}px, ${box.top}px)`,
    width: `${box.width}px`,
    height: `${box.height}px`,
    borderRadius: `${radius}px`,
  }
}
</script>

<template>
  <div class="m-wf-generating">
    <div
      v-for="{ node, box, radius } in items"
      :key="node.id"
      class="m-wf-generating__item"
      :style="boxStyle(box, radius)"
    >
      <!-- 作用域插槽：宿主可用 <template #workflow-generating="{ node, box }"> 完全替换默认 shimmer -->
      <slot :node="node" :box="box">
        <div class="m-wf-generating__shimmer" />
      </slot>
    </div>
  </div>
</template>

<style lang="scss">
.m-wf-generating {
  position: absolute;
  inset: 0;
  pointer-events: none;

  &__item {
    position: absolute;
    left: 0;
    top: 0;
    transform-origin: top left;
    overflow: hidden;
  }

  // 默认「生成中」效果：三色横向流动渐变（可经 CSS 变量覆盖颜色 / 速度）。
  &__shimmer {
    width: 100%;
    height: 100%;
    background: var(
      --m-wf-generating-gradient,
      linear-gradient(90deg, #d39ef8, #b4dffd, #8080f8, #d39ef8)
    );
    background-size: 300% 100%;
    animation: m-wf-generating-flow var(--m-wf-generating-duration, 1.5s) ease-in-out infinite;
  }
}

@keyframes m-wf-generating-flow {
  0% { background-position: 0% 0%; }
  50% { background-position: 100% 0%; }
  100% { background-position: 0% 0%; }
}
</style>

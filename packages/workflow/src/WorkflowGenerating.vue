<script lang="ts" setup>
import type { Aabb2D, Element2D } from 'modern-canvas'
import { useEditor } from 'mce'
import { computed } from 'vue'

// 「生成中」覆盖层：对每个被 setWorkflowGenerating 标记的节点，在其屏幕矩形上盖一层流动 shimmer。
// DOM 覆盖层（非 canvas）：浏览器自驱动画、不侵入文档/导出，且可经 slot / CSS 变量完全自定义。
const { getAabb, drawboardAabb, camera, getNodeById } = useEditor()
const generating = (useEditor() as any).workflowGenerating as Set<string> | undefined

const CULL_MARGIN = 64

// 文字节点骨架条：3 行，宽度交错（相对节点宽，中间行最长）。百分比布局，随节点缩放自适应。
const SKELETON_BARS = ['62%', '92%', '48%']

/** 文字节点（meta.inEditorIs === 'WorkflowText'）用横条骨架，其余用整块 shimmer。 */
function isTextNode(node: Element2D): boolean {
  return (node.meta as any)?.inEditorIs === 'WorkflowText'
}

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
      <!-- 作用域插槽：宿主可用 <template #workflow-generating="{ node, box }"> 完全替换默认加载态 -->
      <slot :node="node" :box="box">
        <!-- 文字节点：横条骨架（模拟文案行，长短交错），与图片/视频的整块 shimmer 区分 -->
        <div v-if="isTextNode(node)" class="m-wf-generating__skeleton">
          <div
            v-for="(w, i) in SKELETON_BARS"
            :key="i"
            class="m-wf-generating__bar"
            :style="{ width: w }"
          />
        </div>
        <div v-else class="m-wf-generating__shimmer" />
      </slot>
    </div>
  </div>
</template>

<style lang="scss">
.m-wf-generating {
  position: absolute;
  inset: 0;
  pointer-events: none;
  // 盖住节点内容（canvas 绘制，天然在 DOM overlay 之下）即可，**不能盖住选框**：
  // 层级约定见 Selection（选框 z-index:1）。这里保持 auto，低于选框。
  z-index: 0;

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

  // 文字节点骨架：跟随主题的表面色底 + 垂直居中的主色横条（模拟文案行，左实右淡出）。
  // 颜色全走主题 token（--m-theme-surface / --m-theme-primary），随站点主色与明暗自适应，
  // 不硬编码。padding 收窄，让横条更靠近节点左右边、留白不过多。
  &__skeleton {
    width: 100%;
    height: 100%;
    padding: 5% 6%;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 8%;
    background: rgb(var(--m-theme-surface, 255, 255, 255));
  }

  &__bar {
    height: 7%;
    border-radius: 999px;
    // 形状：右端羽化淡出（mask），做出骨架行的收尾。
    // 动效：主色高光带**横向流过**（参考稿是流动的两帧，不是静态呼吸），单向连续循环。
    -webkit-mask-image: linear-gradient(90deg, #000 55%, transparent 100%);
    mask-image: linear-gradient(90deg, #000 55%, transparent 100%);
    background: linear-gradient(
      90deg,
      rgba(var(--m-theme-primary), 0.16) 0%,
      rgba(var(--m-theme-primary), 0.5) 50%,
      rgba(var(--m-theme-primary), 0.16) 100%
    );
    background-size: 200% 100%;
    animation: m-wf-generating-bar-flow var(--m-wf-generating-duration, 1.4s) linear infinite;
  }
}

// 图片/视频整块 shimmer 的往返流动（保持原样）。
@keyframes m-wf-generating-flow {
  0% { background-position: 0% 0%; }
  50% { background-position: 100% 0%; }
  100% { background-position: 0% 0%; }
}

// 文字骨架条的单向高光流动：高光从右往左连续流过。
@keyframes m-wf-generating-bar-flow {
  0% { background-position: 100% 0; }
  100% { background-position: -100% 0; }
}
</style>

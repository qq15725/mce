<script lang="ts" setup>
import type { Element2D } from 'modern-canvas'
import { Icon, useEditor, useNode } from 'mce'
import { computed, nextTick, ref, useTemplateRef } from 'vue'

// 工作流模式下顶层元素的标签：图层图标 + 图层名（复用 useNode 的显示策略），
// 定位在元素左上角上方，效果类似画板标题；双击标题可重命名（写入 node.name）。
const props = defineProps<{ node: Element2D }>()

const { getAabb, drawboardAabb, renderEngine, drawboardDom, exec, hoverElement, selection, state, isLock } = useEditor()
const { thumbnailIcon, thumbnailName } = useNode(computed(() => props.node))

// hover / 选中时标题加深，与 canvas 画板标题（Frame.vue 的 --hover/--selected）一致。
const active = computed(() =>
  Boolean(hoverElement.value?.equal(props.node))
  || selection.value.some((v: any) => v.equal(props.node)),
)

const editing = ref(false)
const editValue = ref('')
const input = useTemplateRef('inputTpl')

const box = computed(() => getAabb(props.node, 'drawboard'))

// 节点在屏幕上小于该尺寸时（zoom 很小），标签比节点本身还宽、相邻节点的标签互相重叠，
// 直接隐藏。与选框手柄的精简阈值同量级。
const LABEL_MIN_SIZE = 64

// 标签在节点左上角之上，最多向上探出一行；留一圈余量让平移时的出现/消失不贴着边界。
const CULL_MARGIN = 64

// 节点完全在视口外时不渲染标签。aabb 本来就要算（判定本身需要它），省下的是
// 屏幕外那些标签的 DOM 创建与每帧 style patch——节点上百时这笔开销与
// 「屏幕上真正能看见几个标签」完全无关。
function inViewport(): boolean {
  const a = box.value
  const { width, height } = drawboardAabb.value
  return a.left + a.width > -CULL_MARGIN
    && a.left < width + CULL_MARGIN
    && a.top + a.height > -CULL_MARGIN
    && a.top < height + CULL_MARGIN
}

// 正在重命名时不隐藏，否则输入框会在缩放中途消失。
const visible = computed(() => editing.value || (box.value.width >= LABEL_MIN_SIZE && inViewport()))

// 用 transform 定位（只走合成、不触发布局重排），缩放/平移时重定位成本远低于 left/top，
// 节点多时差异显著。translateY(-100%)/-6px 把标签摆到元素左上角上方。
const style = computed(() => {
  const a = box.value
  // maxWidth = 节点屏幕宽：标题不超过节点宽度、超出即省略，与 canvas 画板标题（Frame.vue 的
  // max-width:100%）一致的省略策略。此处 transform 定位无父级尺寸约束，故显式取 box 宽。
  return {
    transform: `translate(${a.left}px, ${a.top}px) translateY(-100%) translateY(-6px)`,
    maxWidth: `${Math.max(0, a.width)}px`,
  }
})

async function onDblclick(): Promise<void> {
  editValue.value = thumbnailName.value
  editing.value = true
  await nextTick()
  input.value?.focus()
  input.value?.select()
}

function commit(): void {
  editing.value = false
  const value = editValue.value.trim()
  // 置空则回退到默认名（i18n）：清掉 name 让 thumbnailName 重新推导。
  ;(props.node as any).name = value
}

// 点击标题即可拖拽节点：把指针事件转发进画板并以本节点为命中目标（参考 Frame.vue）。
function onPointerdown(event: PointerEvent): void {
  if (editing.value) {
    return
  }
  const cloned = (renderEngine.value.input as any)._clonePointerEvent(event)
  cloned.srcElement = drawboardDom.value
  cloned.target = props.node
  cloned.__FROM__ = event.target
  // noEnter：从标题转发只用于选中/拖拽，不进入元素内容（文字）编辑——双击标题只编辑标题。
  exec('pointerDown', cloned, { allowTopFrame: true, noEnter: true })
}
</script>

<template>
  <div v-if="visible" class="m-wf-label" :class="{ 'm-wf-label--active': active }" :style="style">
    <Icon :icon="thumbnailIcon" class="m-wf-label__icon" />
    <span
      v-if="!editing"
      class="m-wf-label__name"
      @pointerdown="onPointerdown"
      @dblclick.stop.prevent="onDblclick"
      @pointerenter="!state && !isLock(node) && (hoverElement = node)"
      @pointerleave="!state && !isLock(node) && (hoverElement = undefined)"
    >{{ thumbnailName }}</span>
    <input
      v-else
      ref="inputTpl"
      v-model="editValue"
      class="m-wf-label__input"
      name="workflow-node-name"
      @blur="commit"
      @keydown.enter.prevent="commit"
      @pointerdown.stop
    >
  </div>
</template>

<style lang="scss">
.m-wf-label {
  position: absolute;
  left: 0;
  top: 0;
  // 定位走内联 transform（见 style computed），避免 left/top 重排。
  transform-origin: top left;
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.75rem;
  line-height: 1.5;
  color: rgba(var(--m-theme-on-surface), .5);
  pointer-events: none;
  user-select: none;
  white-space: nowrap;
  // max-width 由内联 style 动态取节点屏幕宽（见 style computed），与 canvas 画板标题的省略策略一致。

  // hover / 选中时标题加深，与 canvas 画板标题（Frame.vue --hover/--selected）一致。
  &--active {
    color: rgba(var(--m-theme-on-surface), 1);
  }

  &__icon {
    font-size: 1rem;
    flex-shrink: 0;
  }

  &__name {
    overflow: hidden;
    text-overflow: ellipsis;
    // 仅标题可交互（点击拖拽节点 / 双击重命名）；其余区域不拦截画布事件。
    pointer-events: auto;
    cursor: default;
  }

  &__input {
    padding: 0 2px;
    margin: -1px 0;
    border: none;
    outline: 1px solid rgb(var(--m-theme-primary));
    border-radius: 2px;
    font: inherit;
    color: rgb(var(--m-theme-on-surface));
    background: rgb(var(--m-theme-surface));
    pointer-events: auto;
  }
}
</style>

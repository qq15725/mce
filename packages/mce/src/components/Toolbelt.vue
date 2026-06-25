<script setup lang="ts">
import { computed, ref } from 'vue'
import { useEditor } from '../composables/editor'
import { addDragListener } from '../utils'
import { Icon } from './icon'
import Btn from './shared/Btn.vue'
import Menu from './shared/Menu.vue'
import Tooltip from './shared/Tooltip.vue'
import ToolOptions from './ToolOptions.vue'

const {
  state,
  t,
  activateTool,
  activeTool,
  hotkeys,
  getKbd,
  getConfigRef,
  drawboardAabb,
  toolbeltShapeItems,
  toolbeltItems,
} = useEditor()

const config = getConfigRef<Mce.ToolbeltConfig>('ui.toolbelt')

// —— 停靠式拖拽（贴边滑动 + 居中吸附）——
// 工具栏始终贴某条边；拖手柄时沿离指针最近的边的轴滑动（实时跟随），
// 经过该边中点时吸附居中；松手提交停靠边与沿边偏移。
const SNAP = 12 // 居中吸附阈值（px）
const dragging = ref(false)
// 拖拽中的实时停靠（边 + 沿边中心偏移）；松手提交到 config。
const dragState = ref<{ placement: NonNullable<Mce.ToolbeltConfig['placement']>, offset: number | undefined }>()

const placement = computed(() => dragState.value?.placement ?? config.value?.placement ?? 'bottom')
// 沿边偏移（工具栏中心沿轴坐标，相对画板）。undefined 表示居中（交回 CSS）。
const offset = computed(() => (dragging.value ? dragState.value?.offset : config.value?.offset))

const barStyle = computed(() => {
  const o = offset.value
  if (o == null) {
    return undefined
  }
  // 上/下沿 x 定位、左/右沿 y 定位；居中 transform 由 placement class 提供。
  return (placement.value === 'left' || placement.value === 'right')
    ? { top: `${o}px` }
    : { left: `${o}px` }
})

// 指针落在画板四边中距离最近的一边。
function nearestEdge(px: number, py: number): NonNullable<Mce.ToolbeltConfig['placement']> {
  const ab = drawboardAabb.value
  const dists = { top: py, bottom: ab.height - py, left: px, right: ab.width - px } as const
  return (Object.keys(dists) as (keyof typeof dists)[])
    .reduce((a, b) => (dists[b] < dists[a] ? b : a))
}

function onGripDown(e: MouseEvent): void {
  if (e.button !== 0) {
    return
  }
  e.preventDefault()
  const bar = (e.currentTarget as HTMLElement).closest('.m-toolbelt') as HTMLElement | null
  const rect = bar?.getBoundingClientRect()
  const halfW = (rect?.width ?? 0) / 2
  const halfH = (rect?.height ?? 0) / 2
  // 抓取点相对工具栏中心的偏移：拖拽时保持，避免工具栏瞬移把中心跳到指针下。
  const grabDx = rect ? e.clientX - (rect.left + halfW) : 0
  const grabDy = rect ? e.clientY - (rect.top + halfH) : 0

  addDragListener(e, {
    threshold: 4,
    start: () => {
      dragging.value = true
    },
    move: (ctx) => {
      const ab = drawboardAabb.value
      const px = ctx.movePoint.x - ab.left
      const py = ctx.movePoint.y - ab.top
      const place = nearestEdge(px, py)
      const vertical = place === 'left' || place === 'right'
      const half = vertical ? halfH : halfW
      const axisLen = vertical ? ab.height : ab.width
      const axisCenter = axisLen / 2
      // 工具栏中心沿轴坐标（扣除抓取偏移），夹在画板内（留 8px 边距）。
      const along = vertical ? py - grabDy : px - grabDx
      const pos = Math.min(Math.max(along, half + 8), axisLen - half - 8)
      // 靠近中点吸附居中（offset 置 undefined）。
      dragState.value = {
        placement: place,
        offset: Math.abs(pos - axisCenter) < SNAP ? undefined : pos,
      }
    },
    end: () => {
      dragging.value = false
      if (dragState.value) {
        config.value = {
          ...config.value,
          placement: dragState.value.placement,
          offset: dragState.value.offset,
        }
      }
      dragState.value = undefined
    },
  })
}

// tooltip / 子菜单弹出方向随停靠方向背向工具栏，避免被画布边缘遮挡。
const tooltipLocation = computed(() => (({
  bottom: 'top',
  top: 'bottom',
  left: 'right',
  right: 'left',
} as const)[placement.value]))
const menuLocation = computed(() => (({
  bottom: 'top-start',
  top: 'bottom-start',
  left: 'right-start',
  right: 'left-start',
} as const)[placement.value]))

const activeShape = ref(0)
const activePen = ref(0)

// 直线 / 箭头 / 画笔工具激活时，显示线宽 + 颜色选项面板。
const showToolOptions = computed(() =>
  ['line', 'arrow', 'pen', 'pencil'].includes(activeTool.value?.name ?? ''),
)

const shapeItems = computed(() => {
  // 核心形状工具 + 插件经 registerToolbeltShapeItem 追加的工具（如 @mce/table、@mce/chart）。
  const keys = [
    'rectangle',
    'line',
    'arrow',
    'ellipse',
    'polygon',
    'star',
    ...toolbeltShapeItems.value,
  ]

  return [
    ...keys.map((key, index) => {
      return {
        key,
        handle: () => {
          activeShape.value = index
          activateTool(key)
        },
        checked: activeTool.value?.name === key,
      }
    }),
    {
      key: 'image',
      handle: () => activateTool('image'),
      checked: activeTool.value?.name === 'image',
    },
  ]
})

const penItems = computed(() => {
  const keys = [
    'pen',
    'pencil',
  ]

  return [
    ...keys.map((key, index) => {
      return {
        key,
        handle: () => {
          activePen.value = index
          activateTool(key)
        },
        checked: activeTool.value?.name === key,
      }
    }),
  ]
})

// 插件经 registerToolbeltItem 注册的一级按钮（如 @mce/comments 的评论工具），
// 映射为与内置项同构的结构（无 children），按 placement 分前 / 后。
const pluginItems = computed(() =>
  toolbeltItems.value.map(it => ({
    key: it.key,
    icon: it.icon ?? `$${it.key}`,
    active: it.isActive?.() ?? false,
    handle: it.handle,
    placement: it.placement ?? 'after',
  })),
)

const items = computed(() => {
  return [
    ...pluginItems.value.filter(it => it.placement === 'before'),
    {
      key: ['hand'].includes(state.value || '') ? 'hand' : 'move',
      active: state.value !== 'drawing',
      handle: () => {
        if (['hand'].includes(state.value || '')) {
          //
        }
        else {
          activateTool(undefined)
        }
      },
      children: [
        { key: 'move', handle: () => activateTool(undefined) },
        { key: 'hand', handle: () => state.value = 'hand' },
      ],
    },
    {
      key: activeTool.value?.name === 'slice' ? 'slice' : 'frame',
      active: ['frame', 'slice'].includes(activeTool.value?.name),
      handle: () => activateTool('frame'),
      children: [
        { key: 'frame', handle: () => activateTool('frame') },
        { key: 'slice', handle: () => activateTool('slice') },
      ],
    },
    {
      ...(shapeItems.value.find(v => v.checked) ?? shapeItems.value[activeShape.value]),
      children: shapeItems.value,
    },
    {
      key: 'text',
      active: activeTool.value?.name === 'text',
      handle: () => activateTool('text'),
    },
    {
      ...(penItems.value.find(v => v.checked) ?? penItems.value[activePen.value]),
      children: penItems.value,
    },
    ...pluginItems.value.filter(it => it.placement === 'after'),
  ]
})
</script>

<template>
  <div
    class="m-toolbelt"
    :class="[`m-toolbelt--${placement}`, { 'm-toolbelt--dragging': dragging }]"
    :style="barStyle"
  >
    <ToolOptions
      v-if="showToolOptions"
      class="m-toolbelt__options"
      :class="`m-toolbelt__options--${placement}`"
    />

    <div
      class="m-toolbelt__grip"
      title="拖动以停靠"
      @mousedown="onGripDown"
    >
      <svg width="10" height="16" viewBox="0 0 10 16" aria-hidden="true">
        <g fill="currentColor">
          <circle cx="3" cy="4" r="1.1" />
          <circle cx="7" cy="4" r="1.1" />
          <circle cx="3" cy="8" r="1.1" />
          <circle cx="7" cy="8" r="1.1" />
          <circle cx="3" cy="12" r="1.1" />
          <circle cx="7" cy="12" r="1.1" />
        </g>
      </svg>
    </div>

    <template
      v-for="(tool, key) in items" :key="key"
    >
      <div class="m-toolbelt__group">
        <Tooltip
          :location="tooltipLocation"
          :offset="12"
          show-arrow
        >
          <template #activator="{ props: slotProps }">
            <Btn
              icon
              class="m-toolbelt__btn"
              :active="tool.active || (tool as any).checked || false"
              v-bind="slotProps"
              @click="tool.handle"
            >
              <Icon :icon="(tool as any).icon ?? `$${tool.key}`" />
            </Btn>
          </template>

          <template #default>
            <span>{{ t(tool.key) }}</span>
          </template>

          <template #kbd>
            <template v-if="hotkeys.has(`setState:${tool.key}`)">
              <span>{{ getKbd(`setState:${tool.key}`) }}</span>
            </template>
            <template v-else-if="hotkeys.has(`activateTool:${tool.key}`)">
              <span>{{ getKbd(`activateTool:${tool.key}`) }}</span>
            </template>
          </template>
        </Tooltip>

        <template v-if="(tool as any).children?.length">
          <Menu
            :items="(tool as any).children"
            :offset="12"
            :location="menuLocation"
          >
            <template #activator="{ props }">
              <Btn icon class="m-toolbelt__arrow" v-bind="props">
                <Icon icon="$arrowDown" />
              </Btn>
            </template>

            <template #title="{ item }">
              {{ t(item.key) }}
            </template>

            <template #kbd="{ item }">
              <template v-if="hotkeys.has(`setState:${item.key}`)">
                {{ getKbd(`setState:${item.key}`) }}
              </template>
              <template v-else-if="hotkeys.has(`activateTool:${item.key}`)">
                {{ getKbd(`activateTool:${item.key}`) }}
              </template>
            </template>

            <template #prepend="{ item }">
              <Icon class="m-toolbelt__icon" :icon="`$${item.key}`" />
            </template>
          </Menu>
        </template>
      </div>
    </template>
  </div>
</template>

<style lang="scss">
  .m-toolbelt {
    pointer-events: auto !important;
    position: absolute;
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 6px;
    // 偏暗的拟态浮层、圆角更大、阴影更柔、带细描边。
    background: rgb(var(--m-theme-surface));
    border: 1px solid rgba(var(--m-theme-on-surface), .08);
    border-radius: 14px;
    box-shadow: 0 6px 20px rgba(0, 0, 0, .16), 0 1px 3px rgba(0, 0, 0, .08);
    cursor: default;

    // —— 横向（上 / 下）——
    &--bottom,
    &--top {
      flex-direction: row;
      left: 50%;
      transform: translateX(-50%);
    }

    &--bottom {
      bottom: 18px;
    }

    &--top {
      top: 18px;
    }

    // —— 竖向（左 / 右）——
    &--left,
    &--right {
      flex-direction: column;
      top: 50%;
      transform: translateY(-50%);
    }

    &--left {
      left: 18px;
    }

    &--right {
      right: 18px;
    }

    &--dragging {
      cursor: grabbing;
      box-shadow: 0 12px 32px rgba(0, 0, 0, .24);
      user-select: none;
    }

    // 选项面板：贴着工具栏、朝画布一侧浮出（下停靠→在上方，上停靠→在下方，左右同理）。
    &__options {
      position: absolute;
      z-index: 1;
    }

    &__options--bottom {
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%);
      margin-bottom: 10px;
    }

    &__options--top {
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      margin-top: 10px;
    }

    &__options--left {
      left: 100%;
      top: 50%;
      transform: translateY(-50%);
      margin-left: 10px;
    }

    &__options--right {
      right: 100%;
      top: 50%;
      transform: translateY(-50%);
      margin-right: 10px;
    }

    &__grip {
      display: flex;
      align-items: center;
      justify-content: center;
      color: rgba(var(--m-theme-on-surface), .35);
      cursor: grab;
      flex-shrink: 0;

      &:hover {
        color: rgba(var(--m-theme-on-surface), .6);
      }
    }

    // 竖向时手柄横置（点阵转 90°），并与按钮列对齐。
    &--left &__grip,
    &--right &__grip {
      transform: rotate(90deg);
    }

    &__kbd {
      font-size: 0.75rem;
      white-space: nowrap;
      letter-spacing: .08em;
      margin-left: 16px;
      opacity: .3;
    }

    &__group {
      display: flex;
      align-items: center;
    }

    // 竖向时每组改纵向（按钮在上、下拉箭头在下），保持按钮列居中对齐。
    &--left &__group,
    &--right &__group {
      flex-direction: column;
    }

    &__btn {
      font-size: 20px;
      width: 32px;
      height: 32px;
      border-radius: 8px;
    }

    &__icon {
      font-size: 1rem;
    }

    &__arrow {
      width: 14px;
      height: 32px;
      font-size: 0.625rem;
      border-radius: 6px;
      opacity: .5;
    }

    // 竖向时箭头转为按钮下方的横条。
    &--left &__arrow,
    &--right &__arrow {
      width: 32px;
      height: 14px;
    }
  }
</style>

<script setup lang="ts">
import { computed, onScopeDispose, ref } from 'vue'
import { useEditor } from '../composables/editor'
import { Icon } from './icon'
import Btn from './shared/Btn.vue'
import Menu from './shared/Menu.vue'
import Tooltip from './shared/Tooltip.vue'

const {
  state,
  t,
  activateTool,
  activeTool,
  hotkeys,
  getKbd,
  getConfigRef,
  drawboardPointer,
  drawboardAabb,
  toolbeltShapeItems,
} = useEditor()

const config = getConfigRef<Mce.ToolbeltConfig>('ui.toolbelt')
const placement = computed(() => config.value?.placement ?? 'bottom')

// —— 拖拽吸附：拖手柄时工具栏跟随指针，松手按指针距画板四边最近边吸附 ——
const dragging = ref(false)

const dragStyle = computed(() => {
  const p = drawboardPointer.value
  if (!dragging.value || !p) {
    return undefined
  }
  // drawboardPointer 已是相对画板容器坐标，工具栏也绝对定位于该容器，故直接用。
  return {
    left: `${p.x}px`,
    top: `${p.y}px`,
    right: 'auto',
    bottom: 'auto',
    transform: 'translate(-50%, -50%)',
  }
})

function nearestPlacement(): Mce.ToolbeltConfig['placement'] {
  const p = drawboardPointer.value
  const ab = drawboardAabb.value
  if (!p || !ab) {
    return placement.value
  }
  const dists = {
    top: p.y,
    bottom: ab.height - p.y,
    left: p.x,
    right: ab.width - p.x,
  } as const
  return (Object.keys(dists) as (keyof typeof dists)[])
    .reduce((a, b) => (dists[b] < dists[a] ? b : a))
}

function onDragEnd(): void {
  window.removeEventListener('mouseup', onDragEnd)
  if (!dragging.value) {
    return
  }
  dragging.value = false
  config.value = { ...config.value, placement: nearestPlacement() }
}

function onGripDown(e: MouseEvent): void {
  if (e.button !== 0) {
    return
  }
  e.preventDefault()
  dragging.value = true
  window.addEventListener('mouseup', onDragEnd)
}

onScopeDispose(() => window.removeEventListener('mouseup', onDragEnd))

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

const items = computed(() => {
  return [
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
  ]
})
</script>

<template>
  <div
    class="m-toolbelt"
    :class="[`m-toolbelt--${placement}`, { 'm-toolbelt--dragging': dragging }]"
    :style="dragStyle"
  >
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
              <Icon :icon="`$${tool.key}`" />
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

        <template v-if="tool.children?.length">
          <Menu
            :items="tool.children"
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
    // Figma 风格：偏暗的拟态浮层、圆角更大、阴影更柔、带细描边。
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
      opacity: .92;
      box-shadow: 0 12px 32px rgba(0, 0, 0, .24);
      user-select: none;
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
  }
</style>

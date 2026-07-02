<script setup lang="ts">
import { computed, ref } from 'vue'
import { useEditor } from '../composables/editor'
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
  toolbeltShapeItems,
  toolbeltItems,
  mode,
  modes,
} = useEditor()

const config = getConfigRef<Mce.ToolbeltConfig>('ui.toolbelt')

// 停靠方向（上 / 下 / 左 / 右），仅由配置决定，默认底部横向。
const placement = computed(() => config.value?.placement ?? 'bottom')

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

// 插件经 registerToolbeltItem 注册的一级按钮（如 @mce/comments 的评论工具；不含 slot='create' 的项），
// 映射为与内置项同构的结构（无 children），按 placement 分前 / 后。
const pluginItems = computed(() =>
  toolbeltItems.value
    .filter(it => it.slot !== 'create')
    .map(it => ({
      key: it.key,
      icon: it.icon ?? `$${it.key}`,
      active: it.isActive?.() ?? false,
      handle: it.handle,
      placement: it.placement ?? 'after',
    })),
)

// 「+」菜单：当前模式下插件经 registerToolbeltItem({ slot: 'create' }) 贡献的创建项
// （如 workflow 的新增节点）；无则回退到内置形状 + 图片菜单。
// 「+」菜单项：插件经 registerToolbeltItem({ slot: 'create' }) 贡献（按当前模式过滤）。
// 无贡献项时「+」整体隐藏（不再回退到形状菜单）。
const addChildren = computed(() =>
  toolbeltItems.value.filter(it => it.slot === 'create' && (!it.mode || it.mode === mode.value)),
)

const items = computed(() => {
  return [
    // 开头的「+」：悬浮弹出新增菜单（内容由插件经 slot:'create' 贡献）；无内容则不显示。
    ...(addChildren.value.length
      ? [{
          key: 'add',
          icon: '$plus',
          active: false,
          handle: () => {},
          children: addChildren.value,
        }]
      : []),
    ...pluginItems.value.filter(it => it.placement === 'before'),
    {
      // 抓手工具（去掉「移动」）：再次点击退出，回到默认选择态。
      key: 'hand',
      active: state.value === 'hand',
      handle: () => (state.value = state.value === 'hand' ? undefined : 'hand'),
    },
    {
      key: activeTool.value?.name === 'slice' ? 'slice' : 'frame',
      active: ['frame', 'slice'].includes(activeTool.value?.name),
      // 已激活画板/切片时再次点击则退出绘制（toggle），回到默认选择态。
      handle: () => activateTool(['frame', 'slice'].includes(activeTool.value?.name) ? undefined : 'frame'),
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
      // 再次点击文字工具则退出绘制模式（toggle）。
      handle: () => activateTool(activeTool.value?.name === 'text' ? undefined : 'text'),
    },
    {
      ...(penItems.value.find(v => v.checked) ?? penItems.value[activePen.value]),
      children: penItems.value,
    },
    ...pluginItems.value.filter(it => it.placement === 'after'),
  ]
})

// 底部模式切换（画布 / 插件贡献的模式，如 @mce/workflow 的 workflow）。
// 仅当有插件模式注册时才显示——纯画布下单个按钮无意义。
const modeItems = computed(() =>
  modes.value.length
    ? ['canvas', ...modes.value].map(m => ({
        key: m,
        active: mode.value === m,
        handle: () => (mode.value = m),
      }))
    : [],
)
</script>

<template>
  <div
    class="m-toolbelt"
    :class="`m-toolbelt--${placement}`"
  >
    <ToolOptions
      v-if="showToolOptions"
      class="m-toolbelt__options"
      :class="`m-toolbelt__options--${placement}`"
    />

    <template
      v-for="(tool, key) in items" :key="key"
    >
      <div class="m-toolbelt__group">
        <!-- 有子项：悬浮主按钮弹出菜单（取消原下拉箭头）；点击主按钮激活当前工具 -->
        <Menu
          v-if="(tool as any).children?.length"
          open-on-hover
          close-on-leave
          :items="(tool as any).children"
          :offset="6"
          :location="menuLocation"
        >
          <template #activator="{ props: slotProps }">
            <Btn
              icon
              class="m-toolbelt__btn"
              :class="{ 'm-toolbelt__add': tool.key === 'add' }"
              :active="tool.active || (tool as any).checked || false"
              v-bind="slotProps"
              @click="tool.handle"
            >
              <Icon :icon="(tool as any).icon ?? `$${tool.key}`" />
            </Btn>
          </template>

          <template #title="{ item }">
            {{ t(item.key) }}
          </template>

          <template #kbd="{ item }">
            <template v-if="item.kbd">
              {{ item.kbd }}
            </template>
            <template v-else-if="hotkeys.has(`setState:${item.key}`)">
              {{ getKbd(`setState:${item.key}`) }}
            </template>
            <template v-else-if="hotkeys.has(`activateTool:${item.key}`)">
              {{ getKbd(`activateTool:${item.key}`) }}
            </template>
          </template>

          <template #prepend="{ item }">
            <Icon class="m-toolbelt__icon" :icon="item.icon ?? `$${item.key}`" />
          </template>
        </Menu>

        <!-- 无子项：悬浮显示 tooltip -->
        <Tooltip
          v-else
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
      </div>
    </template>

    <template v-if="modeItems.length">
      <div class="m-toolbelt__divider" />

      <div class="m-toolbelt__modes">
        <Tooltip
          v-for="m in modeItems"
          :key="m.key"
          :location="tooltipLocation"
          :offset="12"
          show-arrow
        >
          <template #activator="{ props: slotProps }">
            <Btn
              icon
              class="m-toolbelt__mode"
              :active="m.active"
              v-bind="slotProps"
              @click="m.handle"
            >
              <Icon :icon="`$${m.key}`" />
            </Btn>
          </template>

          <template #default>
            <span>{{ t(`mode:${m.key}`) }}</span>
          </template>
        </Tooltip>
      </div>
    </template>
  </div>
</template>

<style lang="scss">
  .m-toolbelt {
    $root: &;
    pointer-events: auto !important;
    position: absolute;
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 8px;
    // 纯白大圆角胶囊、更宽松间距、柔和阴影、细描边。
    background: rgb(var(--m-theme-surface));
    border: 1px solid rgba(var(--m-theme-on-surface), .06);
    border-radius: 18px;
    box-shadow: 0 8px 28px rgba(0, 0, 0, .12), 0 2px 6px rgba(0, 0, 0, .06);
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
      width: 36px;
      height: 36px;
      border-radius: 10px;
    }

    // 激活工具：浅灰圆角高亮（参考图风格），覆盖 Btn 默认的主色高亮。
    // `& &__btn` 提高特异性以压过 Btn 的 hover / active 规则。
    & &__btn {
      &.m-btn--active,
      &.m-btn--active:hover {
        color: rgb(var(--m-theme-on-surface));
        background: rgba(var(--m-theme-on-surface), .08);
      }
    }

    // 开头的「+」：固定深色圆角块（主操作，恒高亮，不随选中态变化）。
    & &__add {
      &,
      &:hover,
      &.m-btn--active {
        color: rgb(var(--m-theme-surface));
        background: rgb(var(--m-theme-on-surface));
      }
    }

    // —— 底部模式切换：分隔线 + 分段控件（选中项为白色浮起卡片）——
    &__divider {
      flex-shrink: 0;
      background: rgba(var(--m-theme-on-surface), .1);
      width: 1px;
      height: 20px;
      margin: 0 2px;
    }

    &--left &__divider,
    &--right &__divider {
      width: 20px;
      height: 1px;
      margin: 2px 0;
    }

    &__modes {
      display: flex;
      align-items: center;
      gap: 2px;
      padding: 3px;
      border-radius: 13px;
      background: rgba(var(--m-theme-on-surface), .05);
    }

    &--left &__modes,
    &--right &__modes {
      flex-direction: column;
    }

    &__mode {
      font-size: 20px;
      width: 32px;
      height: 32px;
      border-radius: 9px;
      color: rgba(var(--m-theme-on-surface), .5);
    }

    & &__mode {
      &.m-btn--active,
      &.m-btn--active:hover {
        color: rgb(var(--m-theme-on-surface));
        background: rgb(var(--m-theme-surface));
        box-shadow: 0 2px 6px rgba(0, 0, 0, .12), 0 0 0 1px rgba(0, 0, 0, .04);
      }
    }

    &__icon {
      font-size: 1rem;
    }
  }
</style>

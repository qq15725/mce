<script lang="ts" setup>
import type { PropType } from 'vue'
import { computed, inject, onBeforeUnmount, provide, ref, shallowRef, useId, useTemplateRef } from 'vue'
import { makeMceOverlayProps, MceMenuSymbol } from '../../composables'
import { isClickInsideElement } from '../../utils'
import { Icon } from '../icon'
import Overlay from './Overlay.vue'

defineOptions({
  name: 'MceMenu',
})

const props = defineProps({
  ...makeMceOverlayProps(),
  items: Object as PropType<MenuItem[]>,
  openOnHover: Boolean,
  // 移出激活器与菜单内容后自动关闭（带短暂桥接，容忍两者之间的间隙）。
  // 仅用于无孙级子菜单的悬浮 flyout（如工具腰带），避免干扰右键等嵌套菜单的导航。
  closeOnLeave: Boolean,
  persistent: Boolean,
})

const emit = defineEmits<{
  'click:item': [item: MenuItem, event: MouseEvent]
}>()

defineSlots<{
  title?: (props: { item: MenuItem }) => any
  kbd?: (props: { item: MenuItem }) => any
  prepend?: (props: { item: MenuItem }) => any
  append?: (props: { item: MenuItem }) => any
  activator?: (props: any) => any
}>()

export interface MenuItem {
  key: string
  handle?: (event: MouseEvent) => void
  type?: 'divider'
  checked?: boolean
  disabled?: boolean
  children?: MenuItem[]
  /** 自定义图标名（默认 `$<key>`）；供 prepend 插槽使用。 */
  icon?: string
  /** 直接显示的快捷键提示（供 kbd 插槽使用）。 */
  kbd?: string
}

const isActive = defineModel<boolean>()
const opened = ref<number>(-1)
const overlay = useTemplateRef('overlayTpl')
const menuItemRefs = ref<(HTMLElement | undefined)[]>([])
const hasPrepend = computed(() => Boolean(props.items?.some(v => 'checked' in v)))

const uid = useId()
const parent = inject(MceMenuSymbol, null)
const openChildren = shallowRef(new Set())
provide(MceMenuSymbol, {
  register: () => openChildren.value.add(uid),
  unregister: () => openChildren.value.delete(uid),
  closeParents(e) {
    if (
      !openChildren.value.size
      && !props.persistent
      && (
        e == null
        || (
          overlay.value?.contentEl
          && !isClickInsideElement(e, overlay.value.contentEl)
        )
      )
    ) {
      isActive.value = false
      parent?.closeParents()
    }
  },
})

// 悬浮关闭的桥接计时器：移出激活器/内容时延迟关闭，进入其一即取消，容忍两者间的间隙。
let closeTimer: ReturnType<typeof setTimeout> | undefined
function cancelClose() {
  if (closeTimer) {
    clearTimeout(closeTimer)
    closeTimer = undefined
  }
}
function scheduleClose() {
  if (!props.closeOnLeave || props.persistent) {
    return
  }
  cancelClose()
  // 立即关闭：延到下一个宏任务（0ms，视觉即时），仅为让「移入菜单内容」的
  // mouseenter 有机会先 cancelClose——两者贴合无间隙时该 enter 与本 leave 同批派发。
  closeTimer = setTimeout(() => {
    isActive.value = false
  }, 0)
}

onBeforeUnmount(() => {
  cancelClose()
  parent?.unregister()
  // document.removeEventListener('focusin', onFocusIn)
})

const activatorProps = computed(() => {
  const _props: Record<string, any> = {
    onClick: () => isActive.value = !isActive.value,
  }
  if (props.openOnHover) {
    _props.onMouseenter = () => {
      cancelClose()
      isActive.value = true
    }
    if (props.closeOnLeave) {
      _props.onMouseleave = () => scheduleClose()
    }
  }
  return _props
})

// 悬浮菜单用真实 offset 与激活器留出间隙；间隙里铺一个透明「桥接」子元素，
// 让指针从按钮移到菜单（或反向）时始终停在「菜单容器 + 桥接」之上而不触发关闭，
// 移出到别处才立即关闭。桥接是菜单本体的兄弟节点，故不影响菜单自身的阴影/圆角。
// 桥接朝向激活器一侧，尺寸略大于 offset 以与按钮交叠、消除死区。
const BRIDGE = 12
const bridgeStyle = computed(() => {
  const loc = props.location ?? ''
  if (loc.startsWith('bottom'))
    return { bottom: '100%', left: 0, right: 0, height: `${BRIDGE}px` }
  if (loc.startsWith('left'))
    return { left: '100%', top: 0, bottom: 0, width: `${BRIDGE}px` }
  if (loc.startsWith('right'))
    return { right: '100%', top: 0, bottom: 0, width: `${BRIDGE}px` }
  // 默认（含 top-*）：菜单在按钮上方，桥接铺在菜单下方。
  return { top: '100%', left: 0, right: 0, height: `${BRIDGE}px` }
})

function onClickOutside(e: MouseEvent) {
  parent?.closeParents(e)
}

function updateLocation() {
  overlay.value?.updateLocation()
}

function onClickItem(item: MenuItem, index: number, e: MouseEvent) {
  if (item.children?.length) {
    opened.value = index
  }
  else {
    isActive.value = false
    parent?.closeParents(e)
    if (item.handle) {
      item.handle?.(e)
    }
    else {
      emit('click:item', item, e)
    }
  }
}

function onMouseenter(item: MenuItem, index: number) {
  opened.value = item.disabled ? -1 : index
}

function onMouseleave() {
  if (props.items?.[opened.value]?.children?.length === undefined) {
    opened.value = -1
  }
}

defineExpose({
  isActive,
  activatorEl: computed(() => overlay.value?.activatorEl),
  contentEl: computed(() => overlay.value?.contentEl),
  updateLocation,
})
</script>

<template>
  <Overlay
    ref="overlayTpl"
    v-model="isActive"
    :location="props.location"
    :offset="props.offset"
    :target="props.target"
    :attach="props.attach"
    class="m-menu"
    @click:outside="onClickOutside"
  >
    <template #activator="slotProps">
      <slot
        name="activator"
        v-bind="slotProps"
        :props="{
          ...slotProps.props,
          ...activatorProps,
        }"
      />
    </template>

    <div
      v-if="items?.length"
      class="m-menu-panel"
      @mouseenter="cancelClose"
      @mouseleave="scheduleClose"
    >
      <div
        class="m-list"
        @mouseleave="onMouseleave"
      >
        <template
          v-for="(item, index) in items" :key="index"
        >
          <template v-if="item.type === 'divider'">
            <div
              :ref="el => menuItemRefs[index] = (el ?? undefined) as any"
              class="m-list__divider"
            />
          </template>

          <template v-else>
            <div
              :ref="el => menuItemRefs[index] = (el ?? undefined) as any"
              class="m-list__item"
              @mouseenter="onMouseenter(item, index)"
            >
              <div
                class="m-list-item"
                :class="[
                  item.disabled && 'm-list-item--disabled',
                  opened === index && 'm-list-item--opened',
                ]"
                @click="e => onClickItem(item, index, e)"
              >
                <div v-if="hasPrepend" class="m-list-item__checked">
                  <Icon
                    v-if="item.checked"
                    icon="$check"
                  />
                </div>

                <div v-if="$slots.prepend" class="m-list-item__prepend">
                  <slot name="prepend" :item="item" />
                </div>

                <div class="m-list-item__title">
                  <slot name="title" :item="item">
                    {{ item.key }}
                  </slot>
                </div>

                <div
                  v-if="$slots.kbd"
                  class="m-list-item__kbd"
                >
                  <slot name="kbd" :item="item" />
                </div>

                <div
                  v-if="item.children?.length || $slots.append"
                  class="m-list-item__append"
                >
                  <slot name="append" :item="item" />

                  <Icon
                    v-if="item.children?.length"
                    icon="$arrowRight"
                  />
                </div>
              </div>
            </div>
          </template>
        </template>

        <MceMenu
          v-if="opened > -1 && items?.[opened]?.children?.length"
          open-on-hover
          :items="items?.[opened]?.children"
          location="right"
          :model-value="opened > -1"
          :target="menuItemRefs?.[opened]"
          :attach="false"
          :offset="16"
          @update:model-value="opened = -1"
          @click:item="(_item, _event) => emit('click:item', _item, _event)"
        >
          <template v-if="$slots.title" #title="slotProps">
            <slot name="title" v-bind="slotProps" />
          </template>
          <template v-if="$slots.kbd" #kbd="slotProps">
            <slot name="kbd" v-bind="slotProps" />
          </template>
          <template v-if="$slots.prepend" #prepend="slotProps">
            <slot name="prepend" v-bind="slotProps" />
          </template>
          <template v-if="$slots.append" #append="slotProps">
            <slot name="append" v-bind="slotProps" />
          </template>
        </MceMenu>
      </div>

      <div
        v-if="closeOnLeave"
        class="m-menu-panel__bridge"
        :style="bridgeStyle"
      />
    </div>
  </Overlay>
</template>

<style lang="scss">
.m-menu {
  user-select: none;
}

// 悬浮菜单容器：仅承载 hover 命中与间隙桥接，本身无外观，不影响 .m-list 的阴影/圆角。
.m-menu-panel {
  position: relative;
  display: flex;
  min-height: 0;

  &__bridge {
    position: absolute;
    // 透明桥接，填充 offset 间隙并与按钮交叠，避免移动途中触发关闭。
    background: transparent;
    pointer-events: auto;
  }
}

.m-list {
  display: flex;
  flex-direction: column;
  // 与工具腰带同色（白底深字、细描边、柔和阴影）。
  background-color: rgb(var(--m-theme-surface));
  color: rgb(var(--m-theme-on-surface));
  border: 1px solid rgba(var(--m-theme-on-surface), .06);
  box-shadow: 0 8px 28px rgba(0, 0, 0, .12), 0 2px 6px rgba(0, 0, 0, .06);
  padding: 8px;
  border-radius: 8px;
  gap: 2px;
  // 项过多时限高滚动，避免长列表（如动画预设）撑满视口。
  max-height: min(60vh, 480px);
  overflow-y: auto;

  &__divider {
    border-bottom: 1px solid rgba(var(--m-theme-on-surface), .1);
  }
}

.m-list-item {
  display: flex;
  width: 100%;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  align-items: center;
  gap: 12px;

  &--opened,
  &:hover {
    background-color: rgba(var(--m-theme-on-surface), .08);
    color: rgb(var(--m-theme-on-surface));
  }

  &--disabled {
    pointer-events: none;
    user-select: none;
    opacity: .4;
  }

  &__prepend,
  &__checked {
    width: 12px;
    height: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.875rem;
  }

  &__title {
    flex: 1;
    display: flex;
    align-items: center;
    font-size: 0.75rem;
    white-space: nowrap;
  }

  &__kbd {
    font-size: 0.75rem;
    white-space: nowrap;
    letter-spacing: .08em;
    margin-left: 24px;
    opacity: .3;
  }

  &__append {
    width: 12px;
    height: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    margin-right: -6px;
  }
}
</style>

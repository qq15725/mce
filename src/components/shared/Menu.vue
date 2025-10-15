<script lang="ts" setup>
import type { PropType } from 'vue'
import { computed, inject, onBeforeUnmount, provide, ref, shallowRef, useId, useTemplateRef } from 'vue'
import { makeMceOverlayProps, MceMenuSymbol } from '../../composables'
import { isClickInsideElement } from '../../utils'
import Overlay from './Overlay.vue'

defineOptions({
  name: 'MceMenu',
})

const props = defineProps({
  ...makeMceOverlayProps(),
  items: Object as PropType<MenuItem[]>,
  openOnHover: Boolean,
  persistent: Boolean,
})

const emit = defineEmits<{
  'click:item': [item: MenuItem, event: MouseEvent]
}>()

defineSlots<{
  title?: (props: { item: MenuItem }) => any
  activator?: (props: any) => any
}>()

export interface MenuItem {
  key: string
  handle?: (event: MouseEvent) => void
  type?: 'divider'
  disabled?: boolean
  children?: MenuItem[]
}

const isActive = defineModel<boolean>()
const opened = ref<number>(-1)
const overlay = useTemplateRef('overlayTpl')
const menuItemRefs = useTemplateRef('menuItemTplRefs')

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

onBeforeUnmount(() => {
  parent?.unregister()
  // document.removeEventListener('focusin', onFocusIn)
})

const activatorProps = computed(() => {
  const _props: Record<string, any> = {}
  if (props.openOnHover) {
    _props.onMouseenter = () => isActive.value = true
  }
  return _props
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
    item.handle?.(e)
    emit('click:item', item, e)
  }
}

function onMouseleave() {
  if (props.items?.[opened.value]?.children?.length === undefined) {
    opened.value = -1
  }
}

defineExpose({
  isActive,
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
    class="mce-menu"
    @click:outside="onClickOutside"
  >
    <template #activator="slotProps">
      <slot
        name="activator"
        v-bind="slotProps"
        :props="{ ...slotProps.props, ...activatorProps }"
      />
    </template>

    <div
      v-if="items?.length"
      class="mce-list"
      @mouseleave="onMouseleave"
    >
      <template
        v-for="(item, index) in items" :key="index"
      >
        <template v-if="item.type === 'divider'">
          <div
            ref="menuItemTplRefs"
            class="mce-list__divider"
          />
        </template>

        <template v-else>
          <div
            ref="menuItemTplRefs"
            class="mce-list__item"
            @mouseenter="item.disabled ? (opened = -1) : (opened = index)"
          >
            <div
              class="mce-list-item"
              :class="[
                item.disabled && 'mce-list-item--disabled',
                opened === index && 'mce-list-item--opened',
              ]"
              @click="e => onClickItem(item, index, e)"
            >
              <div class="mce-list-item__title">
                <slot name="title" :item="item">
                  {{ item.key }}
                </slot>
              </div>

              <template v-if="item.children?.length">
                <div
                  v-if="item.children?.length"
                  class="mce-list-item__append"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 256 256"><path fill="currentColor" d="m181.66 133.66l-80 80a8 8 0 0 1-11.32-11.32L164.69 128L90.34 53.66a8 8 0 0 1 11.32-11.32l80 80a8 8 0 0 1 0 11.32" /></svg>
                </div>
              </template>
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
        :offset="8"
        @update:model-value="opened = -1"
        @click:item="(_item, _event) => emit('click:item', _item, _event)"
      >
        <template v-if="$slots.title" #title="slotProps">
          <slot name="title" v-bind="slotProps" />
        </template>
      </MceMenu>
    </div>
  </Overlay>
</template>

<style lang="scss">
.mce-menu {
  user-select: none;
}

.mce-list {
  display: flex;
  flex-direction: column;
  background-color: rgba(var(--mce-theme-on-surface), 1);
  color: rgba(var(--mce-theme-surface), 1);
  box-shadow: var(--mce-shadow);
  padding: 4px;
  border-radius: 4px;
  gap: 2px;

  &__divider {
    border-bottom: 1px solid rgba(var(--mce-theme-surface), .12);
  }
}

.mce-list-item {
  display: flex;
  width: 100%;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  align-items: center;
  gap: 12px;

  &--opened,
  &:hover {
    background-color: rgba(var(--mce-theme-primary), 1);
    color: rgba(var(--mce-theme-on-primary), 1);
  }

  &--disabled {
    pointer-events: none;
    user-select: none;
    opacity: .4;
  }

  &__title {
    flex: 1;
    display: flex;
    align-items: center;
    font-size: 12px;
    white-space: nowrap;
  }

  &__append {
    width: 12px;
    height: 12px;

    > svg {
      display: block;
      width: 100%;
      height: 100%;
    }
  }
}
</style>

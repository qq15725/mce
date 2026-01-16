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

onBeforeUnmount(() => {
  parent?.unregister()
  // document.removeEventListener('focusin', onFocusIn)
})

const activatorProps = computed(() => {
  const _props: Record<string, any> = {
    onClick: () => isActive.value = !isActive.value,
  }
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
    class="mce-menu"
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
      class="mce-list"
      @mouseleave="onMouseleave"
    >
      <template
        v-for="(item, index) in items" :key="index"
      >
        <template v-if="item.type === 'divider'">
          <div
            :ref="el => menuItemRefs[index] = (el ?? undefined) as any"
            class="mce-list__divider"
          />
        </template>

        <template v-else>
          <div
            :ref="el => menuItemRefs[index] = (el ?? undefined) as any"
            class="mce-list__item"
            @mouseenter="onMouseenter(item, index)"
          >
            <div
              class="mce-list-item"
              :class="[
                item.disabled && 'mce-list-item--disabled',
                opened === index && 'mce-list-item--opened',
              ]"
              @click="e => onClickItem(item, index, e)"
            >
              <div v-if="hasPrepend" class="mce-list-item__checked">
                <Icon
                  v-if="item.checked"
                  icon="$check"
                />
              </div>

              <div v-if="$slots.prepend" class="mce-list-item__prepend">
                <slot name="prepend" :item="item" />
              </div>

              <div class="mce-list-item__title">
                <slot name="title" :item="item">
                  {{ item.key }}
                </slot>
              </div>

              <div
                v-if="$slots.kbd"
                class="mce-list-item__kbd"
              >
                <slot name="kbd" :item="item" />
              </div>

              <div
                v-if="item.children?.length || $slots.append"
                class="mce-list-item__append"
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
  </Overlay>
</template>

<style lang="scss">
.mce-menu {
  user-select: none;
}

.mce-list {
  display: flex;
  flex-direction: column;
  background-color: rgb(var(--mce-theme-on-surface));
  color: rgb(var(--mce-theme-surface));
  box-shadow: var(--mce-shadow);
  padding: 8px;
  border-radius: 8px;
  gap: 2px;
  max-height: inherit;
  overflow-y: auto;

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

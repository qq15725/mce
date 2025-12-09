<script setup lang="ts">
import type { Node } from 'modern-canvas'
import type { PropType } from 'vue'
import { computed, nextTick, ref } from 'vue'
import { useEditor, useLayerItem } from '../composables'
import { Icon } from './icon'
import Btn from './shared/Btn.vue'

defineOptions({
  name: 'MceLayer',
  inheritAttrs: false,
})

const props = defineProps({
  root: Boolean,
  node: {
    type: Object as PropType<Node>,
    required: true,
  },
  active: Boolean,
  indent: {
    type: Number,
    default: 0,
  },
})

const {
  isElement,
  isFrame,
  isVisible,
  setVisible,
  isLock,
  setLock,
  selection,
  nodes,
  nodeIndexMap,
  zoomTo,
  hoverElement,
  exec,
} = useEditor()

const opened = defineModel('opened', { default: false })
const dom = ref<HTMLElement>()

const {
  selecting,
  sortedSelection,
} = useLayerItem({
  id: props.node.id,
  opened,
  node: computed(() => props.node),
  dom: computed(() => dom.value),
})
const isFrist = computed(() => sortedSelection.value[0]?.equal(props.node))
const isLast = computed(() => {
  const last = sortedSelection.value[sortedSelection.value.length - 1]
  if (last) {
    if (last.equal(props.node)) {
      if (!opened.value || !props.node?.children.length)
        return true
    }
    else if (last.equal(props.node?.parent)) {
      // TODO
    }
  }
  return false
})
const isActive = computed(() => selection.value.some(v => v.equal(props.node)))

const inputDom = ref<HTMLInputElement>()
const isHoverElement = computed(() => props.node?.equal(hoverElement.value))
const hovering = ref(false)
const editing = ref(false)
const editValue = ref<string>()
const thumbnailIcon = computed(() => {
  const node = props.node
  if (isFrame(node)) {
    return '$frame'
  }
  else if (node.children.filter(isElement).length) {
    return '$group'
  }
  else if (isElement(node)) {
    if (node.foreground.isValid() && node.foreground.image) {
      return '$image'
    }
    if (node.text.isValid()) {
      return '$text'
    }
  }
  return '$shape'
})

function onMousedown() {
  // TODO
}

function onClickExpand() {
  opened.value = !opened.value
}

function onClickContent(e: MouseEvent) {
  selecting.value = true
  if (e.shiftKey) {
    const _nodes = [
      ...selection.value.filter(v => !v.equal(props.node)),
      props.node,
    ]
    let min: number | undefined
    let max: number | undefined
    _nodes.forEach((el) => {
      const index = nodeIndexMap.get(el.id)
      if (index !== undefined) {
        min = min === undefined ? index : Math.min(min, index)
        max = max === undefined ? index : Math.max(max, index)
      }
    })
    if (min !== undefined && max !== undefined) {
      let _selection = nodes.value.slice(min, max + 1)

      // compact selection
      const result = new Set<string>(_selection.map(node => node.id))
      const parents = new Set<Node>()
      _selection.forEach(node => node.parent && parents.add(node.parent))
      parents.forEach((parent) => {
        if (parent.children.every(ch => result.has(ch.id))) {
          const ids = new Set<string>(parent.children.map(ch => ch.id))
          _selection = [
            ..._selection.filter(v => !ids.has(v.id)),
            parent,
          ]
        }
      })
      selection.value = _selection
    }
  }
  else if (e.ctrlKey || e.metaKey) {
    const filtered = selection.value.filter(v => !v.equal(props.node))
    if (filtered.length !== selection.value.length) {
      selection.value = filtered
    }
    else {
      selection.value = [...filtered, props.node]
    }
  }
  else {
    selection.value = [props.node]
  }
  nextTick().then(() => {
    selecting.value = false
  })
}

function onDblclickThumbnail(e: MouseEvent) {
  e.stopPropagation()
  if (isElement(props.node)) {
    zoomTo('selection', {
      behavior: 'smooth',
    })
  }
}

function onDblclickContent() {
  editing.value = true
  editValue.value = props.node.name
  nextTick().then(() => {
    const dom = inputDom.value
    if (dom) {
      dom.focus()
      dom.select()
    }
  })
}

function onMouseenter() {
  if (isElement(props.node)) {
    hoverElement.value = props.node
    hovering.value = true
  }
}

function onMouseleave() {
  hoverElement.value = undefined
  hovering.value = false
}

function onContextmenu(e: PointerEvent) {
  if (!selection.value.some(v => v.equal(props.node))) {
    selection.value = [props.node]
  }
  exec('openContextMenu', e)
}

function onInputBlur() {
  editing.value = false
  if (editValue.value) {
    ;(props.node as any).name = editValue.value
    editValue.value = undefined
  }
}
</script>

<template>
  <div
    ref="dom"
    class="mce-layer"
    :class="[
      props.root && 'mce-layer--root',
      (active || isActive) && 'mce-layer--active',
      isFrist && 'mce-layer--first',
      isLast && 'mce-layer--last',
      opened && 'mce-layer--open',
      isHoverElement && 'mce-layer--hover',
    ]"
    :style=" {
      '--indent-padding': `${props.indent * 16}px`,
    }"
    @mousedown="onMousedown"
    @mouseenter="onMouseenter"
    @mouseleave="onMouseleave"
    @contextmenu="onContextmenu"
  >
    <div
      class="mce-layer__expand"
      @click="onClickExpand"
    >
      <Icon
        v-if="props.node.children.length"
        icon="$arrowRight"
      />
    </div>

    <div
      class="mce-layer__content"
      @click="onClickContent"
      @dblclick="onDblclickContent"
    >
      <div
        class="mce-layer__thumbnail"
        @dblclick="onDblclickThumbnail"
      >
        <Icon :icon="thumbnailIcon" />
      </div>

      <div class="mce-layer__name">
        <input
          v-show="editing"
          ref="inputDom"
          v-model="editValue"
          type="text"
          class="mce-layer__input"
          autofocus
          @blur="onInputBlur"
        >
        <div
          :style="{ visibility: editing ? 'hidden' : undefined }"
        >
          {{ editValue || props.node.name || props.node.id }}
        </div>
      </div>

      <div class="mce-layer__action">
        <template v-if="props.root">
          <Btn
            icon
            class="mce-layer__btn"
            :class="{
              'mce-layer__btn--hide': !hovering && !isLock(props.node),
            }"
            @click="setLock(props.node, !isLock(props.node))"
          >
            <Icon :icon="isLock(props.node) ? '$lock' : '$unlock'" />
          </Btn>
        </template>

        <template v-else>
          <Btn
            icon
            class="mce-layer__btn"
            :class="{
              'mce-layer__btn--hide': !hovering && !isLock(props.node),
            }"
            @click.prevent.stop="setLock(props.node, !isLock(props.node))"
          >
            <Icon :icon="isLock(props.node) ? '$lock' : '$unlock'" />
          </Btn>

          <Btn
            icon
            class="mce-layer__btn"
            :class="{
              'mce-layer__btn--hide': !hovering && isVisible(props.node),
            }"
            @click.prevent.stop="setVisible(props.node, !isVisible(props.node))"
          >
            <Icon :icon="isVisible(props.node) ? '$visible' : '$unvisible'" />
          </Btn>
        </template>
      </div>
    </div>
  </div>

  <template v-if="opened">
    <MceLayer
      v-for="(child, key) of props.node.children" :key="key"
      :node="child"
      :indent="root ? props.indent : (props.indent + 1)"
      :active="active || isActive"
    />
  </template>
</template>

<style lang="scss">
  .mce-layer {
    position: relative;
    flex: none;
    display: flex;
    align-items: center;
    height: 32px;
    font-size: 0.75rem;
    padding-left: var(--indent-padding, 0);
    width: 100%;
    min-width: max-content;
    border-radius: 4px;

    &:before {
      content: '';
      position: absolute;
      left: 0;
      right: 0;
      top: 4px;
      bottom: 4px;
      background-color: var(--underlay-color, transparent);
      pointer-events: none;
      border-radius: inherit;
    }

    &:after {
      content: '';
      position: absolute;
      left: 0;
      right: 0;
      top: 4px;
      bottom: 4px;
      background-color: var(--overlay-color, transparent);
      pointer-events: none;
      border-radius: inherit;
    }

    &--root {
      margin-bottom: 4px;
      font-weight: bold;

      .mce-layer__thumbnail {
        display: none;
      }
    }

    &--hover {
      --overlay-color: rgba(var(--mce-theme-on-background), var(--mce-hover-opacity));
    }

    &--active:before {
      top: 0;
      bottom: 0;
      border-radius: 0;
    }

    &--first:before {
      border-top-left-radius: 4px;
      border-top-right-radius: 4px;
      top: 4px;
    }

    &--last:before {
      border-bottom-left-radius: 4px;
      border-bottom-right-radius: 4px;
      bottom: 4px;
    }

    &--active {
      --underlay-color: rgba(var(--mce-theme-primary), calc(var(--mce-activated-opacity) * 3));
    }

    &--active:hover {
      --overlay-color: rgba(var(--mce-theme-primary), var(--mce-hover-opacity));
    }

    &--open {
      .mce-layer__expand .mce-icon {
        transform: rotate(90deg);
      }
    }

    &__expand {
      display: flex;
      align-items: center;
      width: 16px;
      height: 100%;
      flex: none;
    }

    &__content {
      flex: 1;
      display: flex;
      align-items: center;
      height: 100%;
    }

    &__thumbnail {
      display: flex;
      align-items: center;
      width: 12px;
      height: 100%;
      font-size: 0.75rem;
      overflow: hidden;
      margin-right: 4px;
    }

    &__name {
      position: relative;
      flex: 1;
    }

    &__input {
      position: absolute;
      left: 0;
      top: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      border: none;
      outline: 1px solid rgb(var(--mce-theme-primary));
      font-size: inherit;
      font-weight: inherit;
      border-radius: 2px;
    }

    &__action {
      flex: none;
      display: flex;
      align-items: center;
    }

    &__btn {
      &--hide {
        opacity: 0;
      }

      + .mce-layer__btn {
        margin-left: -4px;
      }
    }
  }
</style>

<script setup lang="ts">
import type { Node } from 'modern-canvas'
import type { PropType } from 'vue'
import { computed, nextTick, ref } from 'vue'
import { useEditor, useLayerItem } from '../composables'
import Icon from './shared/Icon.vue'

defineOptions({
  name: 'MceLayer',
})

const props = defineProps({
  node: {
    type: Object as PropType<Node>,
    required: true,
  },
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
  nodeIndexMap,
  zoomTo,
  hoverElement,
  exec,
} = useEditor()

const {
  selecting,
  opened,
  isActive,
  dom,
} = useLayerItem({
  id: props.node.id,
  node: computed(() => props.node),
  selection,
})

const hoveredElement = computed(() => props.node?.equal(hoverElement.value))
const hovered = ref(false)
const editing = ref(false)

function onClickExpand() {
  opened.value = !opened.value
}

function onClickContent(e: MouseEvent) {
  selecting.value = true
  if (isElement(props.node)) {
    if (e.shiftKey) {
      const nodes = [
        ...selection.value.filter(v => !v.equal(props.node)),
        props.node,
      ]
      let min: number | undefined
      let max: number | undefined
      nodes.forEach((el) => {
        const index = nodeIndexMap.get(el.id)
        if (index !== undefined) {
          min = min === undefined ? index : Math.min(min, index)
          max = max === undefined ? index : Math.max(max, index)
        }
      })
      if (min !== undefined && max !== undefined) {
        let _selection = nodes.slice(min, max + 1)

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
}

function onMouseenter() {
  if (isElement(props.node)) {
    hoverElement.value = props.node
    hovered.value = true
  }
}

function onMouseleave() {
  hoverElement.value = undefined
  hovered.value = false
}

function onContextmenu(e: PointerEvent) {
  if (isElement(props.node)) {
    if (!selection.value.some(v => v.equal(props.node))) {
      selection.value = [props.node]
    }
    exec('openContextMenu', e)
  }
}

const editValue = ref<string>()

function onInput(e: InputEvent) {
  editValue.value = (e.target as HTMLInputElement).value
}

function onInputBlur() {
  editing.value = false
  if (editValue.value) {
    ;(props.node as any).name = editValue.value
    editValue.value = undefined
  }
}

const thumbnailIcon = computed(() => {
  const node = props.node
  if (isFrame(node)) {
    return '$frame'
  }
  else if (node.children.length) {
    return '$group'
  }
  if (isElement(node)) {
    if (node.foreground.isValid() && node.foreground.image) {
      return '$image'
    }
    if (node.text.isValid()) {
      return '$text'
    }
  }
  return '$shape'
})
</script>

<template>
  <div
    ref="dom"
    class="mce-layer"
    :class="[
      isActive && 'mce-layer--active',
      opened && 'mce-layer--open',
      hoveredElement && 'mce-layer--hover',
    ]"
    :style=" {
      '--indent-padding': `${props.indent * 16}px`,
    }"
    @mouseenter="onMouseenter"
    @mouseleave="onMouseleave"
    @contextmenu="onContextmenu"
  >
    <div
      class="mce-layer__expand"
      @click="onClickExpand"
    >
      <Icon v-if="props.node.children.length" icon="$arrowRight" />
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
          v-if="editing"
          type="text"
          class="mce-layer__input"
          autofocus
          :value="props.node.name"
          @blur="onInputBlur"
          @input="onInput"
        >

        <span v-else>{{ props.node.name || props.node.id }}</span>
      </div>

      <div style="flex: 1;" />

      <div class="mce-layer__action">
        <div
          class="mce-btn"
          :class="{
            'mce-btn--hide': !hovered && !isLock(props.node),
          }"
          @click="setLock(props.node, !isLock(props.node))"
        >
          <Icon :icon="isLock(props.node) ? '$lock' : '$unlock'" />
        </div>

        <div
          class="mce-btn"
          :class="{
            'mce-btn--hide': !hovered && isVisible(props.node),
          }"
          @click="setVisible(props.node, !isVisible(props.node))"
        >
          <Icon :icon="isVisible(props.node) ? '$visible' : '$unvisible'" />
        </div>
      </div>
    </div>
  </div>

  <template v-if="opened">
    <MceLayer
      v-for="(child, key) of props.node.children" :key="key"
      :node="child"
      :indent="props.indent + 1"
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
    font-size: 12px;
    padding-left: var(--indent-padding, 0);
    width: 100%;
    min-width: max-content;

    &:before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      right: 0;
      pointer-events: none;
    }

    &:after {
      content: '';
      position: absolute;
      left: 0;
      top: 2px;
      bottom: 2px;
      right: 0;
      background-color: var(--overlay-color, transparent);
      pointer-events: none;
    }

    &:hover {
      --overlay-color: rgba(var(--mce-theme-on-background), var(--mce-hover-opacity));
    }

    &--hover {
      --overlay-color: rgba(var(--mce-theme-on-background), var(--mce-hover-opacity));
    }

    &--active:before {
      background: rgba(var(--mce-theme-primary), calc(var(--mce-activated-opacity) * 3));
    }

    &--active:hover:after {
      background: rgba(var(--mce-theme-primary), var(--mce-hover-opacity));
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
      font-size: 12px;
      overflow: hidden;
    }

    &__name {
      padding: 0 8px;
    }

    &__input {
      border: none;
      padding: 0;
      outline: none;
      font-size: inherit;
      font-weight: inherit;
    }

    &__action {
      display: flex;
      align-items: center;
    }
  }

  .mce-btn {
    padding: 4px;
    border-radius: 4px;
    height: 24px;
    width: 24px;
    font-size: 12px;
    display: flex;
    align-items: center;
    justify-content: center;

    &--hide {
      opacity: 0;
    }

    &:hover {
      background-color: rgb(var(--mce-theme-background));
    }

    + .mce-btn {
      margin-left: -4px;
    }
  }
</style>

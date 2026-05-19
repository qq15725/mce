<script setup lang="ts">
import type { Element2D, Node } from 'modern-canvas'
import { computed, nextTick, ref, useTemplateRef } from 'vue'
import { useEditor, useNode } from '../../composables'
import { addDragListener } from '../../utils'
import { Icon } from '../icon'

const props = defineProps<{
  node: Node
}>()

const editor = useEditor()
const {
  selection,
  isVisible,
  setVisible,
  isLock,
  setLock,
  hoverElement,
  isElement,
} = editor

const nodeRef = computed(() => props.node)
const { thumbnailIcon, thumbnailName } = useNode(nodeRef, editor)

const selected = computed(() => selection.value.some(v => v.equal(props.node)))
const hovering = ref(false)
const editing = ref(false)
const editValue = ref<string>('')
const inputDom = useTemplateRef<HTMLInputElement>('inputDom')

const showActions = computed(() => {
  return hovering.value || isLock(props.node) || !isVisible(props.node)
})

function onMousedown(e: MouseEvent) {
  if (e.button !== 0)
    return
  if (e.shiftKey) {
    const filtered = selection.value.filter(v => !v.equal(props.node))
    selection.value = filtered.length !== selection.value.length
      ? filtered
      : [...selection.value, props.node]
  }
  else {
    selection.value = [props.node]
  }

  addDragListener(e, {
    threshold: 10,
    start: () => {
      document.body.style.cursor = 'grabbing'
    },
    move: ({ event }) => {
      const target = event.composedPath().find((t) => {
        return t instanceof HTMLElement && t.classList.contains('m-trackhead')
      }) as HTMLElement | undefined
      document.querySelectorAll('.m-trackhead--dropping').forEach(el => el.classList.remove('m-trackhead--dropping'))
      if (target && target.dataset.id !== props.node.id) {
        target.classList.add('m-trackhead--dropping')
      }
    },
    end: ({ event }) => {
      document.body.style.cursor = ''
      document.querySelectorAll('.m-trackhead--dropping').forEach(el => el.classList.remove('m-trackhead--dropping'))
      const target = event.composedPath().find((t) => {
        return t instanceof HTMLElement && t.classList.contains('m-trackhead')
      }) as HTMLElement | undefined
      const toId = target?.dataset.id
      if (!toId || toId === props.node.id)
        return
      const parent = props.node.parent
      if (!parent)
        return
      const to = parent.children.find(c => c.id === toId)
      if (!to)
        return
      let toIndex = to.getIndex() + 1
      if (to.getIndex() > props.node.getIndex()) {
        toIndex--
      }
      parent.moveChild(props.node, toIndex)
    },
  })
}

function onMouseenter() {
  if (isElement(props.node)) {
    hoverElement.value = props.node as Element2D
  }
  hovering.value = true
}

function onMouseleave() {
  hoverElement.value = undefined
  hovering.value = false
}

function onDblclickName(e: MouseEvent) {
  e.stopPropagation()
  editing.value = true
  editValue.value = thumbnailName.value
  nextTick().then(() => {
    inputDom.value?.focus({ preventScroll: true })
    inputDom.value?.select()
  })
}

function onInputBlur() {
  editing.value = false
  if (editValue.value && editValue.value !== thumbnailName.value) {
    ;(props.node as any).name = editValue.value
  }
}

function onInputKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    inputDom.value?.blur()
  }
  else if (e.key === 'Escape') {
    editing.value = false
  }
}

function onToggleLock(e: MouseEvent) {
  e.stopPropagation()
  setLock(props.node, !isLock(props.node))
}

function onToggleVisible(e: MouseEvent) {
  e.stopPropagation()
  setVisible(props.node, !isVisible(props.node))
}
</script>

<template>
  <div
    class="m-trackhead"
    :class="[
      selected && 'm-trackhead--selected',
    ]"
    :data-id="node.id"
    @mousedown="onMousedown"
    @mouseenter="onMouseenter"
    @mouseleave="onMouseleave"
  >
    <div class="m-trackhead__thumbnail">
      <Icon :icon="thumbnailIcon" />
    </div>

    <div class="m-trackhead__name" @dblclick="onDblclickName">
      <input
        v-if="editing"
        ref="inputDom"
        v-model="editValue"
        type="text"
        class="m-trackhead__input"
        spellcheck="false"
        autocapitalize="off"
        autocorrect="off"
        @blur="onInputBlur"
        @keydown="onInputKeydown"
        @mousedown.stop
      >
      <span v-else>{{ thumbnailName }}</span>
    </div>

    <div
      class="m-trackhead__action"
      :class="{ 'm-trackhead__action--show': showActions }"
    >
      <button
        type="button"
        class="m-trackhead__btn"
        :class="{ 'm-trackhead__btn--show': isLock(node) }"
        @mousedown.stop
        @click="onToggleLock"
      >
        <Icon :icon="isLock(node) ? '$lock' : '$unlock'" />
      </button>

      <button
        type="button"
        class="m-trackhead__btn"
        :class="{ 'm-trackhead__btn--show': !isVisible(node) }"
        @mousedown.stop
        @click="onToggleVisible"
      >
        <Icon :icon="isVisible(node) ? '$visible' : '$unvisible'" />
      </button>
    </div>
  </div>
</template>

<style lang="scss">
  .m-trackhead {
    display: flex;
    align-items: center;
    height: 22px;
    min-height: 22px;
    padding: 0 4px;
    color: rgba(var(--m-theme-on-surface), 0.8);
    font-size: 0.75rem;
    width: 100%;
    border-radius: 4px;
    user-select: none;
    cursor: default;

    &:hover {
      background-color: rgba(var(--m-theme-on-surface), 0.06);
    }

    &--selected {
      background-color: rgba(var(--m-theme-primary), calc(var(--m-activated-opacity) * 3));
    }

    &--dropping {
      box-shadow: 0 1px 0 0 rgb(var(--m-theme-on-background));
    }

    &__thumbnail {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 14px;
      height: 14px;
      flex: none;
      margin-right: 6px;
      font-size: 0.875rem;
      opacity: 0.7;
    }

    &__name {
      flex: 1;
      min-width: 0;
      position: relative;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    &__input {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      padding: 0 2px;
      margin: 0;
      border: none;
      outline: 1px solid rgb(var(--m-theme-primary));
      background: rgb(var(--m-theme-surface));
      color: inherit;
      font: inherit;
      border-radius: 2px;
    }

    &__action {
      display: flex;
      align-items: center;
      flex: none;
      gap: 1px;
      margin-left: 4px;

      .m-trackhead__btn {
        opacity: 0;
      }

      &--show .m-trackhead__btn {
        opacity: 1;
      }
    }

    &__btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 16px;
      height: 16px;
      padding: 0;
      border: 0;
      border-radius: 3px;
      background: transparent;
      color: inherit;
      cursor: pointer;
      opacity: 0;
      font-size: 0.75rem;

      &:hover {
        background-color: rgba(var(--m-theme-on-surface), 0.12);
      }

      &--show {
        opacity: 1 !important;
      }
    }
  }
</style>

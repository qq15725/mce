<script lang="ts" setup>
import type { Element2D } from 'modern-canvas'
import { computed, nextTick, ref, useTemplateRef } from 'vue'
import { useEditor } from '../composables'
import { nodeLabelStyle } from '../utils/nodeLabel'

defineProps<{
  outline?: boolean
}>()

const frame = defineModel<Element2D>({ required: true })
const input = useTemplateRef('inputTpl')

const {
  getObb,
  hoverElement,
  selection,
  state,
  exec,
  renderEngine,
  drawboardDom,
  isLock,
  mode,
  readonly,
} = useEditor()

const editing = ref(false)
const box = computed(() => getObb(frame.value, 'drawboard'))
const labelStyle = computed(() => nodeLabelStyle(box.value))

async function onDblclick() {
  if (readonly.value || isLock(frame.value))
    return
  editing.value = true
  await nextTick()
  if (input.value) {
    input.value.focus()
    input.value.select()
  }
}

async function onPointerdown(event: PointerEvent) {
  if (!editing.value && !isLock(frame.value)) {
    // 借用 modern-canvas 私有 API `_clonePointerEvent` 转发指针事件到画板内部命中——
    // 缺一个公开的 forwardPointer/cloneEvent API；等 modern-canvas 暴露后改。
    const cloend = (renderEngine.value.input as any)._clonePointerEvent(event)
    cloend.srcElement = drawboardDom.value
    cloend.target = frame.value
    cloend.__FROM__ = event.target
    exec('pointerDown', cloend, {
      allowTopFrame: true,
    })
  }
}
</script>

<template>
  <div
    v-show="frame.visible"
    class="m-frame"
    :class="[
      outline && 'm-frame--outline',
      hoverElement?.equal(frame) && 'm-frame--hover',
      selection.some(v => v.equal(frame)) && 'm-frame--selected',
      isLock(frame) && 'm-frame--lock',
    ]"
  >
    <div v-if="outline" class="m-frame__outline" :style="box.toCssStyle()" />
    <div
      v-if="mode !== 'workflow'"
      class="m-frame__name"
      :style="labelStyle"
      @dblclick.prevent.stop="onDblclick"
      @pointerdown="onPointerdown"
      @pointerenter="!state && !isLock(frame) && (hoverElement = frame)"
      @pointerleave="!state && !isLock(frame) && (hoverElement = undefined)"
    >
      <div>{{ frame.name }}</div>
      <input
        v-if="editing"
        ref="inputTpl"
        v-model="frame.name"
        name="frame-name"
        @blur="editing = false"
        @keydown.enter.prevent="editing = false"
        @keydown.esc.prevent="editing = false"
      >
    </div>
  </div>
</template>

<style lang="scss">
.m-frame {
  $root: &;
  position: absolute;
  left: 0;
  top: 0;

  &__outline {
    position: absolute;
    outline: 1px solid rgba(var(--m-theme-on-surface), .17);
  }

  &--lock {
    pointer-events: none;
  }

  &--hover,
  &--selected {
    #{$root}__name {
      > div {
        opacity: 1;
      }
    }
  }

  &__name {
    position: absolute;
    top: 0;
    left: 0;
    font-size: 0.75rem;
    line-height: 1.5;
    pointer-events: auto;
    user-select: none;
    max-width: 100%;

    > div {
      position: relative;
      min-width: 28px;
      box-sizing: content-box;
      color: rgb(var(--m-theme-on-surface));
      opacity: .5;
      max-width: 100%;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    > input {
      position: absolute;
      left: 0;
      top: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      border: none;
      outline: 1px solid rgb(var(--m-theme-primary));
      cursor: default;
      font-size: inherit;
      font-weight: inherit;
      border-radius: 2px;
    }
  }
}
</style>

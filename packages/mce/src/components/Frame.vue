<script lang="ts" setup>
import type { Element2D } from 'modern-canvas'
import { nextTick, ref, useTemplateRef } from 'vue'
import { useEditor } from '../composables'

const frame = defineModel<Element2D>({ required: true })
const input = useTemplateRef('inputTpl')

const {
  getObb,
  hoverElement,
  selection,
  state,
  config,
  exec,
  renderEngine,
  drawboardDom,
  isLock,
} = useEditor()

const editing = ref(false)

async function onDblclick() {
  editing.value = true
  await nextTick()
  if (input.value) {
    input.value.focus()
    input.value.select()
  }
}

async function onPointerdown(event: PointerEvent) {
  if (!editing.value) {
    // TODO
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
    :style="getObb(frame, 'drawboard').toCssStyle()"
    class="mce-frame"
    :class="[
      config.frameOutline && 'mce-frame--outline',
      hoverElement?.equal(frame) && 'mce-frame--hover',
      selection.some(v => v.equal(frame)) && 'mce-frame--selected',
      isLock(frame) && 'mce-frame--lock',
    ]"
  >
    <div
      class="mce-frame__name"
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
      >
    </div>
  </div>
</template>

<style lang="scss">
.mce-frame {
  $root: &;
  position: absolute;

  &--outline {
    outline: 1px solid #0000002b;
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
    transform: translate(0%, -100%) translate(0px, -4px);
    transform-origin: left bottom;
    font-size: 0.75rem;
    line-height: 1.5;
    pointer-events: auto;
    user-select: none;
    max-width: 100%;

    > div {
      position: relative;
      min-width: 28px;
      box-sizing: content-box;
      color: rgb(var(--mce-theme-on-surface));
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
      outline: 1px solid rgb(var(--mce-theme-primary));
      cursor: default;
      font-size: inherit;
      font-weight: inherit;
      border-radius: 2px;
    }
  }
}
</style>

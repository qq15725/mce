<script lang="ts" setup>
import type { Element2D } from 'modern-canvas'
import { nextTick, ref, useTemplateRef } from 'vue'
import { useEditor } from '../composables'
import { boundingBoxToStyle } from '../utils/box'

const frame = defineModel<Element2D>({ required: true })
const input = useTemplateRef('inputTpl')

const {
  getObbInDrawboard,
  hoverElement,
  setActiveElement,
  state,
  config,
  exec,
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

async function onPointerdown(ev: PointerEvent) {
  if (!editing.value) {
    setActiveElement(frame.value)
    await nextTick()
    exec('startTransform', ev)
  }
}
</script>

<template>
  <div
    v-show="frame.visible"
    :style="boundingBoxToStyle(getObbInDrawboard(frame))"
    class="mce-frame"
  >
    <div
      v-show="config.viewMode === 'edgeless'"
      class="mce-frame__name"
      @dblclick="onDblclick"
      @pointerdown="onPointerdown"
      @pointerenter="!state && (hoverElement = frame)"
      @pointerleave="!state && (hoverElement = undefined)"
    >
      <div>{{ frame.name }}</div>
      <input
        v-show="editing"
        ref="inputTpl"
        v-model="frame.name"
        @blur="editing = false"
      >
    </div>
  </div>
</template>

<style lang="scss">
.mce-frame {
  position: absolute;
  border: 1px solid #0000002b;

  &__name {
    position: absolute;
    top: 0;
    left: 0;
    transform: translate(0%, -100%) translate(0px, -4px);
    transform-origin: left bottom;
    font-size: 12px;
    line-height: 1.5;
    white-space: nowrap;
    pointer-events: auto;
    user-select: none;

    > div {
      position: relative;
      min-width: 28px;
      box-sizing: content-box;
      color: rgba(var(--mce-theme-on-surface), .8);
    }

    > input {
      position: absolute;
      left: 0;
      top: 0;
      outline: none;
      width: 100%;
      height: 100%;
      border: 1px solid #0000002b;
      border-radius: 4px;
      cursor: default;
    }
  }
}
</style>

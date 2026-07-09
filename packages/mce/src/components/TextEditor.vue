<script lang="ts" setup>
import type { TextEditor as _TextEditor } from '../web-components'
import { computed, nextTick, onBeforeMount, onBeforeUnmount, ref } from 'vue'
import { useEditor } from '../composables/editor'

const {
  elementSelection,
  state,
  textSelection,
  exec,
  getObb,
  registerCommand,
  unregisterCommand,
  camera,
} = useEditor()

const textEditor = ref<_TextEditor>()

const mainStyleWithScale = computed(() => {
  const { zoom, position } = camera.value
  return {
    transformOrigin: 'left top',
    transform: `translate(${-position.x}px, ${-position.y}px) scale(${zoom.x}, ${zoom.y})`,
  }
})

const textEditorStyle = computed(() => {
  const element = elementSelection.value[0]
  const obb = getObb(element)
  const textBox = element?.text.base?.boundingBox
  if (textBox) {
    obb.left += textBox.left
    obb.top += textBox.top
  }
  return obb.toCssStyle()
})

function onUpdateTextSelection(e: CustomEvent): void {
  textSelection.value = e.detail
}

function onUpdate(): void {
  const element = elementSelection.value[0]!
  if (!element.shape.isValid()) {
    exec('textToFit', element)
  }
  ;(element as any)._textContent = element.text.getStringContent()
}

function onSubmit(): void {
  state.value = undefined
}

async function startTyping(e?: PointerEvent): Promise<boolean> {
  const element = elementSelection.value[0]
  if (!element) {
    return false
  }
  if (!element.text.isValid()) {
    element.style.textAlign = 'center'
    element.text.setContent(' ')
  }
  element.text.update()
  state.value = 'typing'
  const editor = textEditor.value!
  editor.set(element.text.base)
  await nextTick()
  // 有坐标（双击 / 点击进入）：光标落在点击位置；无坐标（Enter / 程序化 / 新建空文本）：进入即全选。
  // positionOnly 定位光标但不挂拖选监听，避免进入后移动鼠标误触发选区扩展。
  if (editor.pointerDown(e, true)) {
    if (!e) {
      editor.selectAll()
    }
    // A double-click fires pointerdown → mousedown on the drawboard; the
    // trailing mousedown's default action steals focus to <body> right after
    // we focus the hidden textarea. Re-focus once the gesture settles so typed
    // keys land in the editor instead of leaking to global hotkeys（有坐标时仅
    // 重新聚焦、保留点击处光标，不重新全选）。
    requestAnimationFrame(() => {
      if (state.value === 'typing') {
        if (e) {
          editor.focus()
        }
        else {
          editor.selectAll()
        }
      }
    })
    return true
  }
  return false
}

onBeforeMount(() => {
  registerCommand({ command: 'startTyping', handle: startTyping })
})

onBeforeUnmount(() => {
  unregisterCommand('startTyping')
})

defineExpose({
  textEditor,
})
</script>

<template>
  <div
    v-show="elementSelection[0] && state === 'typing'"
    class="m-text-editor"
    :style="{
      ...mainStyleWithScale,
    }"
  >
    <div
      class="m-text-editor__wrapper"
      :style="{
        ...textEditorStyle,
      }"
    >
      <text-editor
        ref="textEditor"
        class="m-text-editor__editor"
        :style="{
          '--color': 'var(--m-theme-primary)',
        }"
        data-pointerdown_to_drawboard
        @selected="onUpdateTextSelection"
        @update="onUpdate"
        @submit="onSubmit"
      />
    </div>
  </div>
</template>

<style lang="scss">
.m-text-editor {
  position: absolute;
  width: 0;
  height: 0;
  left: 0;
  top: 0;
  overflow: visible;

  &__wrapper {
    position: absolute;
  }

  &__editor {
    pointer-events: auto !important;
    cursor: move;
  }
}
</style>

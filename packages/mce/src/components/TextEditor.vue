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
  // 进入编辑一律全选（双击 / Enter / 程序化都一样）：进来就能整段替换，与设计稿一致；
  // 想在某处插入光标，进入后再单击即可。pointerDown 仍要调用——它负责聚焦隐藏 textarea
  // 并初始化选区状态；positionOnly 不挂拖选监听，避免进入后移动鼠标误触发选区扩展。
  if (editor.pointerDown(e, true)) {
    editor.selectAll()
    // A double-click fires pointerdown → mousedown on the drawboard; the
    // trailing mousedown's default action steals focus to <body> right after
    // we focus the hidden textarea. Re-focus once the gesture settles so typed
    // keys land in the editor instead of leaking to global hotkeys.
    requestAnimationFrame(() => {
      if (state.value === 'typing') {
        editor.focus()
        editor.selectAll()
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

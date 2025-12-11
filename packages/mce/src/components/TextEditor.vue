<script lang="ts" setup>
import type { TextEditor as _TextEditor } from 'modern-text/web-components'
import { computed, nextTick, onBeforeMount, onBeforeUnmount, ref } from 'vue'
import { useEditor } from '../composables/editor'

const {
  elementSelection,
  state,
  textSelection,
  textToFit,
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
  const shape = element.shape
  if (!shape.enabled || !(shape as any)._path2DSet.paths.length) {
    textToFit(element)
  }
}

async function startTyping(e?: PointerEvent): Promise<boolean> {
  const element = elementSelection.value[0]
  if (!element) {
    return false
  }
  if (!element.text.isValid()) {
    element.text.setContent(' ')
  }
  element.text.update()
  state.value = 'typing'
  const editor = textEditor.value!
  editor.set(element.text.base)
  await nextTick()
  if (editor.pointerDown(e)) {
    editor.selectAll()
    // TODO updateSelectionByDom
    ;(editor as any)._updateSelectionByDom()
    return true
  }
  return false
}

onBeforeMount(() => registerCommand({ command: 'startTyping', handle: startTyping }))
onBeforeUnmount(() => unregisterCommand('startTyping'))

defineExpose({
  textEditor,
})
</script>

<template>
  <div
    v-show="elementSelection[0] && state === 'typing'"
    class="mce-text-editor"
    :style="{
      ...mainStyleWithScale,
    }"
  >
    <div
      class="mce-text-editor__wrapper"
      :style="{
        ...textEditorStyle,
      }"
    >
      <text-editor
        ref="textEditor"
        class="mce-text-editor__editor"
        :style="{
          '--color': 'var(--mce-theme-primary)',
        }"
        data-pointerdown_to_drawboard
        @selected="onUpdateTextSelection"
        @update="onUpdate"
      />
    </div>
  </div>
</template>

<style lang="scss">
.mce-text-editor {
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

<script lang="ts" setup>
import { computed, nextTick, onBeforeMount, onBeforeUnmount, ref } from 'vue'
import { useEditor } from '../composables/editor'
import { boundingBoxToStyle } from '../utils/box'

const {
  activeElement,
  state,
  textSelection,
  textToFit,
  getObb,
  registerCommand,
  unregisterCommand,
  camera,
} = useEditor()

const textEditor = ref<any>()

const mainStyleWithScale = computed(() => {
  const { zoom, position } = camera.value
  return {
    transformOrigin: 'left top',
    transform: `translate(${position.x}px, ${position.y}px) scale(${zoom.x}, ${zoom.y})`,
  }
})

const textEditorStyle = computed(() => {
  const element = activeElement.value
  const obb = getObb(element)
  const textBox = element?.text.base?.boundingBox
  if (textBox) {
    obb.left += textBox.left
    obb.top += textBox.top
  }
  const style = boundingBoxToStyle(obb)
  return {
    ...style,
  }
})

function onUpdateTextSelection(e: CustomEvent): void {
  textSelection.value = e.detail
}

function onUpdate(): void {
  const element = activeElement.value!
  const shape = element.shape
  if (!shape.enabled || !(shape as any)._path2DSet.paths.length) {
    textToFit(element)
  }
}

async function startTyping(e?: PointerEvent): Promise<boolean> {
  const element = activeElement.value
  if (!element) {
    return false
  }
  if (!element.text.canDraw()) {
    element.text.setContent(' ')
  }
  element.text.updateMeasure()
  state.value = 'typing'
  const editor = textEditor.value as any
  editor.text = element.text.base
  await nextTick()
  return editor.start(e) as boolean
}

onBeforeMount(() => registerCommand('startTyping', startTyping))
onBeforeUnmount(() => unregisterCommand('startTyping'))

defineExpose({
  textEditor,
})
</script>

<template>
  <div
    v-show="activeElement && state === 'typing'"
    class="mce-text-editor"
    :style="{
      ...mainStyleWithScale,
    }"
  >
    <text-editor
      ref="textEditor"
      class="mce-text-editor__editor"
      :style="{
        ...textEditorStyle,
        '--color': 'var(--mce-theme-primary)',
      }"
      data-pointerdown_to_drawboard
      @selected="onUpdateTextSelection"
      @update="onUpdate"
    />
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

  &__editor {
    pointer-events: auto !important;
    cursor: move;
  }
}
</style>

<script setup lang="ts">
import bigesj, { editorOptions } from '@mce/bigesj'
import gaoding from '@mce/gaoding'
import mp4 from '@mce/mp4'
import openxml from '@mce/openxml'
import pdf from '@mce/pdf'
import svg from '@mce/svg'
import { Editor, EditorLayers, EditorLayout, EditorLayoutItem } from 'mce'
import gifWorkerUrl from 'modern-gif/worker?url'
import { computed } from 'vue'
import 'mce/styles'

const editor = new Editor({
  ...editorOptions,
  plugins: [
    bigesj({ font: true }),
    gaoding(),
    mp4(),
    openxml(),
    pdf(),
    svg(),
  ],
  watermark: '/example.jpg',
  screenCenterOffset: { left: 100, top: 100, right: 100, bottom: 100 },
  gifWorkerUrl,
  toolbelt: true,
})

window.editor = editor
window.doc = editor.doc

const searchParams = new URL(window.location.href).searchParams
const tid = searchParams.get('tid')
const bid = searchParams.get('bid')
const url = searchParams.get('url')
if (tid || bid) {
  editor.loadDoc({ tid, bid })
}
else if (url) {
  editor.loadDoc(url)
}

const element = computed(() => editor.elementSelection.value[0])
</script>

<template>
  <div style="width: 100vw; height: 100vh">
    <EditorLayout :editor="editor">
      <template #selection />
      <template #selection-transform />
      <template #selection-foreground-cropper="{ scale, setScale, setAspectRatio, ok, cancel }">
        <div class="bar cropbar">
          <button @click="() => setAspectRatio(0)">
            原图大小
          </button>
          <button @click="() => setAspectRatio([3, 4])">
            3:4
          </button>
          <button @click="() => setAspectRatio([16, 9])">
            16:9
          </button>
          <input :value="scale" type="number" style="width: 64px" @change="setScale(($event.target as any).value)">
          <button @click="cancel">
            取消
          </button>
          <button @click="ok">
            确定
          </button>
        </div>
      </template>
      <template #floatbar>
        <div class="bar floatbar">
          <template v-if="element?.foreground.isValid()">
            <button @click="() => editor.state.value = editor.state.value === 'cropping' ? undefined : 'cropping'">
              裁剪
            </button>
            <button @click="() => element!.meta.lockAspectRatio = !element!.meta.lockAspectRatio">
              {{ element!.meta.lockAspectRatio ? '解锁' : '锁定' }}宽高比
            </button>
          </template>
          <span v-else>FLOATBAR-TOP</span>
        </div>
      </template>
      <template #drawboard />

      <EditorLayoutItem
        position="left"
        :size="200"
      >
        <EditorLayers />
      </EditorLayoutItem>
    </EditorLayout>
  </div>
</template>

<style scoped lang="scss">
.bar{
  min-width: max-content;
  padding: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
  border-radius: 8px;
  background: white;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.2);
  button{
    height: 24px;
    padding: 0 8px;
    font-size: 0.75rem;
    border: 1px solid #999;
    border-radius: 8px;
    cursor: pointer;
  }
}
.cropbar{
  position: absolute;
  bottom: -12px;
  transform: translateY(100%);
}
</style>

<script setup lang="ts">
import bigesj, { editorOptions } from '@mce/bigesj'
import gaoding from '@mce/gaoding'
import mp4 from '@mce/mp4'
import openxml from '@mce/openxml'
import pdf from '@mce/pdf'
import svg from '@mce/svg'
import { Editor, EditorLayers, EditorLayout, EditorLayoutItem } from 'mce'
import gifWorkerUrl from 'modern-gif/worker?url'
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
</script>

<template>
  <div style="width: 100vw; height: 100vh">
    <EditorLayout :editor="editor">
      <template #selector>
        <div style="position: absolute; right: -12px; top: 0; transform: translateX(100%); background: red; writing-mode: vertical-rl;">
          TOOLBAR-RIGHT
        </div>
      </template>
      <template #transformer />
      <template #floatbar>
        <div style="background: red;">
          FLOATBAR-TOP
        </div>
      </template>
      <template #drawboard />

      <EditorLayoutItem
        position="left"
        :size="240"
      >
        <EditorLayers />
      </EditorLayoutItem>
    </EditorLayout>
  </div>
</template>

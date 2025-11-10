<script setup lang="ts">
import bigesj from '@mce/bigesj'
import gaoding from '@mce/gaoding'
import mp4 from '@mce/mp4'
import openxml from '@mce/openxml'
import pdf from '@mce/pdf'
import svg from '@mce/svg'
import { Editor, EditorLayout } from 'mce'
import gifWorkerUrl from 'modern-gif/worker?url'
import 'mce/styles'

const editor = new Editor({
  plugins: [
    bigesj({ font: true }),
    gaoding(),
    mp4(),
    openxml(),
    pdf(),
    svg(),
  ],
  theme: 'system',
  viewMode: 'edgeless',
  checkerboard: true,
  pixelGrid: true,
  camera: true,
  ruler: true,
  scrollbar: true,
  timeline: false,
  statusbar: true,
  wheelZoom: false,
  frameOutline: false,
  frameGap: 48,
  typographyStrategy: 'autoHeight',
  handleShape: 'rect',
  screenCenterOffset: { left: 100, top: 100, right: 100, bottom: 100 },
  defaultFont: { family: 'SourceHanSansCN-Normal', src: '/SourceHanSansCN-Normal.woff' },
  localDb: false,
  gifWorkerUrl,
  locale: {
    locale: 'zh',
  },
})

window.editor = editor
window.doc = editor.doc

const searchParams = new URL(window.location.href).searchParams
const tid = searchParams.get('tid')
const bid = searchParams.get('bid')
if (tid || bid) {
  editor.loadDoc({ tid, bid })
}
</script>

<template>
  <div style="width: 100vw; height: 100vh">
    <EditorLayout :editor="editor">
      <template #selector="{ box }" />
      <template #transformer="{ box }" />
      <template #floatbar />
      <template #drawboard />
    </EditorLayout>
  </div>
</template>

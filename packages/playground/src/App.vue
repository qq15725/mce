<script setup lang="ts">
import bigesj from '@mce/bigesj'
import gaoding from '@mce/gaoding'
import { Drawboard, Editor } from 'mce'
import 'mce/styles'

const editor = new Editor({
  plugins: [
    bigesj,
    gaoding,
  ],
  theme: 'system',
  language: 'en',
  viewMode: 'edgeless',
  checkerboard: true,
  pixelGrid: true,
  camera: true,
  ruler: true,
  scrollbar: true,
  bottombar: true,
  statusbar: true,
  wheelZoom: false,
  frameGap: 48,
  typographyStrategy: 'autoHeight',
  handleShape: 'rect',
  zoomToFitOffset: { left: 0, top: 0, right: 0, bottom: 0 },
  defaultFont: { family: 'SourceHanSansCN-Normal', src: '/SourceHanSansCN-Normal.woff' },
  localDb: false,
})

// editor.on('setDoc', () => {
//   editor.load('http://localhost:5173/example.jpg').then((el) => {
//     editor.addElement(el, {
//       position: { x: 500, y: 100 },
//     })
//   })
// })

window.editor = editor
window.doc = editor.doc
</script>

<template>
  <div style="width: 100vw; height: 100vh">
    <Drawboard :editor="editor">
      <template #selector="{ box }" />
      <template #transformer="{ box }" />
      <template #floatbar />
      <template #bottombar />
    </Drawboard>
  </div>
</template>

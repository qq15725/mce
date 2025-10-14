<script setup lang="ts">
// import { Drawboard, Editor } from 'modern-canvas-editor'
// import 'modern-canvas-editor/styles'
import { Drawboard, Editor } from '../../src'

const editor = new Editor({
  theme: 'system',
  language: 'en',
  viewMode: 'edgeless',
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
  localDb: true,
  defaultFont: { family: 'SourceHanSansCN-Normal', src: '/SourceHanSansCN-Normal.woff' },
  // doc: 'test',
  doc: {
    id: 'test',
    children: [
      {
        style: { left: 10, top: 10, width: 500, height: 500 },
        children: [
          { foreground: '/example.png', style: { width: 500, height: 500 } },
        ],
        meta: {
          inEditorIs: 'Frame',
        },
      },
      { foreground: '/example.jpg', style: { left: 520, top: 10, width: 500, height: 500 } },
      { foreground: '/example.gif', style: { left: 1030, top: 10, width: 500, height: 500 } },
      { text: 'test', style: { rotate: 40, left: 100, top: 500, width: 60, height: 40, fontSize: 20, color: '#FF00FF' } },
      {
        style: { left: 200, top: 500, width: 100, height: 100, fontSize: 22 },
        text: [
          {
            letterSpacing: 3,
            fragments: [
              { content: 'He', color: '#00FF00', fontSize: 12 },
              { content: 'llo', color: '#000000' },
            ],
          },
          { content: ', ', color: '#FF0000' },
          { content: 'World!', color: '#0000FF' },
        ],
      },
    ],
  },
})

editor.on('setDoc', () => {
  editor.load('http://localhost:5173/example.jpg').then((el) => {
    editor.addElement(el, {
      position: { x: 500, y: 100 },
    })
  })
})

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

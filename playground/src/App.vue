<script setup lang="ts">
import { onBeforeMount } from 'vue'
// import { Drawboard, Editor } from 'modern-canvas-editor'
// import 'modern-canvas-editor/styles'
import { Doc, Drawboard, Editor } from '../../src'

const editor = new Editor({
  // default
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
  localDb: true,
  // custom
  defaultFont: { family: 'SourceHanSansCN-Normal', src: '/SourceHanSansCN-Normal.woff' },
  doc: 'test',
  // doc: {
  //   id: 'test',
  //   children: [
  //     { foreground: '/example.png', text: 'I\'m PNG', style: { left: 10, top: 10, width: 500, height: 500 } },
  //     { foreground: '/example.jpg', text: 'I\'m JPEG', style: { left: 520, top: 10, width: 500, height: 500 } },
  //     { foreground: '/example.gif', text: 'I\'m GIF', style: { left: 1030, top: 10, width: 500, height: 500 } },
  //     { text: 'test', style: { rotate: 40, left: 100, top: 500, width: 60, height: 40, fontSize: 20, color: '#FF00FF' } },
  //     {
  //       style: { left: 200, top: 500, width: 100, height: 100, fontSize: 22 },
  //       text: [
  //         {
  //           letterSpacing: 3,
  //           fragments: [
  //             { content: 'He', color: '#00FF00', fontSize: 12 },
  //             { content: 'llo', color: '#000000' },
  //           ],
  //         },
  //         { content: ', ', color: '#FF0000' },
  //         { content: 'World!', color: '#0000FF' },
  //       ],
  //     },
  //   ],
  // },
})

onBeforeMount(async () => {
  window.doc = editor.doc

  const doc = new Doc('Test')

  await doc.load(() => {
    doc.set({
      name: 'Test',
      meta: {
        workspaceId: 1,
      },
    })
  })

  console.log(doc.toJSON())
})
</script>

<template>
  <div style="width: 100vw; height: 100vh">
    <Drawboard :editor="editor">
      <template #selector="{ box }">
        Selector
      </template>

      <template #transformer="{ box }">
        <text>Transformer(in SVG)</text>
      </template>

      <template #floatbar>
        Floatbar
      </template>

      <template #bottombar>
        Bottombar
      </template>
    </Drawboard>
  </div>
</template>

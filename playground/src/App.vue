<script setup lang="ts">
// import { Drawboard, Editor } from 'modern-canvas-editor'
// import 'modern-canvas-editor/styles'
import { Drawboard, Editor } from '../../src'

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
  localDb: false,
  // custom
  defaultFont: { family: 'SourceHanSansCN-Normal', src: '/SourceHanSansCN-Normal.woff' },
  doc: {
    children: [
      { foreground: '/example.png', text: 'I\'m PNG', style: { left: 10, top: 10, width: 100, height: 100 } },
      { foreground: '/example.jpg', text: 'I\'m JPEG', style: { left: 120, top: 10, width: 100, height: 100 } },
      { foreground: '/example.gif', text: 'I\'m GIF', style: { left: 230, top: 10, width: 100, height: 100 } },
      { foreground: '/example.mp4', text: 'I\'m MP4', style: { left: 340, top: 10, width: 100, height: 100 } },
      { text: 'test', style: { rotate: 40, left: 100, top: 100, width: 60, height: 40, fontSize: 20, color: '#FF00FF' } },
      {
        style: { left: 200, top: 100, width: 100, height: 100, fontSize: 22 },
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

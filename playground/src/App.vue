<script setup lang="ts">
// import { Drawboard, Editor } from 'modern-canvas-editor'
// import 'modern-canvas-editor/styles'
import { Drawboard, Editor } from '../../src'

const editor = new Editor({
  // default
  theme: 'system',
  language: 'en',
  viewMode: 'edgeless',
  camera: false,
  ruler: false,
  scrollbar: false,
  bottombar: false,
  statusbar: false,
  wheelZoom: false,
  frameGap: 48,
  typographyStrategy: 'autoHeight',
  handleShape: 'rect',
  localDb: false,
  // custom
  defaultFont: { family: 'SourceHanSansCN-Normal', src: '/SourceHanSansCN-Normal.woff' },
  doc: {
    children: [
      { foreground: '/example.png', style: { rotate: 60, left: 200, top: 10, width: 50, height: 50 } },
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

<script setup lang="ts">
import { Drawboard, Editor } from 'mce'
import 'mce/styles'

const editor = new Editor({
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
  localDb: true,
  defaultFont: { family: 'SourceHanSansCN-Normal', src: '/SourceHanSansCN-Normal.woff' },
  // doc: 'test',
  doc: {
    id: '432c5427-3747-43a6-9922-2fa12074923a',
    children: [
      { text: 'TEST', style: { left: 0, top: -20, width: 500, height: 100, fontSize: 100, color: '#FF00FF' } },
      {
        id: 't3dr53jx7e',
        style: { left: 0, top: 100, width: 936, height: 1664 },
        foreground: 'https://inspo.cdn.bcebos.com/image_agent/user/9/2f06be450f713690d7c222e327fb77b0.jpg',
      },
      {
        id: 't3drl24vaw',
        style: { left: 1036, top: 100, width: 1024, height: 1024 },
        foreground: 'https://inspo.cdn.bcebos.com/image_agent/user/9/4f201f49ccc7b70d37d8be083b358667.jpg',
      },
      {
        id: 't3drvauugc',
        style: { left: 2160, top: 100, width: 2048, height: 2048 },
        foreground: 'https://inspo.cdn.bcebos.com/image_agent/user/9/b043ffc3ebf75bdbda3f1d966b9480fd.jpg',
      },
      {
        id: 't3dsj7iso1',
        style: { left: 0, top: 2248, width: 2048, height: 2048 },
        foreground: 'https://inspo.cdn.bcebos.com/image_agent/user/9/9c4fc5bbb918debc712a75a1d6e5cf78.jpg',
      },
      {
        id: 't441vte2es',
        style: { left: 2148, top: 2248, width: 2048, height: 2048 },
        foreground: 'https://bgseg.oss-cn-shanghai.aliyuncs.com/image_agent/3.0/1760426643_2b3b763a.jpg',
      },
    ],
  },
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

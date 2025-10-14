<h1 align="center">modern-canvas-editor</h1>

<p align="center">
  <a href="https://unpkg.com/modern-canvas-editor">
    <img src="https://img.shields.io/bundlephobia/minzip/modern-canvas-editor" alt="Minzip">
  </a>
  <a href="https://www.npmjs.com/package/modern-canvas-editor">
    <img src="https://img.shields.io/npm/v/modern-canvas-editor.svg" alt="Version">
  </a>
  <a href="https://www.npmjs.com/package/modern-canvas-editor">
    <img src="https://img.shields.io/npm/dm/modern-canvas-editor" alt="Downloads">
  </a>
  <a href="https://github.com/qq15725/modern-canvas-editor/issues">
    <img src="https://img.shields.io/github/issues/qq15725/modern-canvas-editor" alt="Issues">
  </a>
  <a href="https://github.com/qq15725/modern-canvas-editor/blob/main/LICENSE">
    <img src="https://img.shields.io/npm/l/modern-canvas-editor.svg" alt="License">
  </a>
</p>

## 📦 Install

```shell
npm i modern-canvas-editor
```

## 🦄 Usage

```vue
<script setup lang="ts">
  import { Drawboard, Editor } from 'modern-canvas-editor'
  import 'modern-canvas-editor/styles'

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
    localDb: false,
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

  editor.on('setDoc', () => {
    editor.load('http://localhost:5173/example.jpg').then((el) => {
      editor.addElement(el, {
        position: { x: 500, y: 100 },
      })
    })
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
```

slot sub component

```vue
<script setup lang="ts">
  import { useEditor } from 'modern-canvas-editor'
  const { activeElement } = useEditor()
</script>

<template>
  <div>
    {{ activeElement }}
  </div>
</template>
```

## Related

- [CodeSandbox Playground](https://codesandbox.io/p/devbox/thirsty-dawn-t2h69m)

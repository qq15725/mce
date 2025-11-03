<h1 align="center">mce</h1>

<p align="center">
  <a href="https://unpkg.com/mce">
    <img src="https://img.shields.io/bundlephobia/minzip/mce" alt="Minzip">
  </a>
  <a href="https://www.npmjs.com/package/mce">
    <img src="https://img.shields.io/npm/v/mce.svg" alt="Version">
  </a>
  <a href="https://www.npmjs.com/package/mce">
    <img src="https://img.shields.io/npm/dm/mce" alt="Downloads">
  </a>
  <a href="https://github.com/qq15725/mce/issues">
    <img src="https://img.shields.io/github/issues/qq15725/mce" alt="Issues">
  </a>
  <a href="https://github.com/qq15725/mce/blob/main/LICENSE">
    <img src="https://img.shields.io/npm/l/mce.svg" alt="License">
  </a>
</p>

<p align="center">The headless canvas editor framework. only the ESM.</p>

## 📦 Install

```shell
npm i mce
```

## 🦄 Usage

```vue
<script setup lang="ts">
  import { Editor, EditorLayout, EditorLayoutItem } from 'mce'
  import 'mce/styles'
  import openxml from '@mce/openxml'
  import pdf from '@mce/pdf'
  import svg from '@mce/svg'

  const editor = new Editor({
    plugins: [
      openxml(),
      pdf(),
      svg(),
    ],
    theme: 'system',
    language: 'en',
    viewMode: 'edgeless',
    checkerboard: true,
    pixelGrid: true,
    camera: true,
    ruler: true,
    scrollbar: true,
    statusbar: true,
    wheelZoom: false,
    frameGap: 48,
    typographyStrategy: 'autoHeight',
    handleShape: 'rect',
    zoomToFitOffset: { left: 0, top: 0, right: 0, bottom: 0 },
    localDb: false,
    upload: async (blob) => URL.createObjectURL(blob),
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
    <EditorLayout :editor="editor">
      <template #selector="{ box }" />
      <template #transformer="{ box }" />
      <template #floatbar />
      <template #drawboard />
      <EditorLayoutItem model-value position="top" :size="56" />
      <EditorLayoutItem model-value position="left" :size="380" />
      <EditorLayoutItem model-value position="right" :size="260" />
    </EditorLayout>
  </div>
</template>
```

slot sub component

```vue
<script setup lang="ts">
  import { useEditor } from 'mce'
  const { selection } = useEditor()
</script>

<template>
  <div>
    {{ selection }}
  </div>
</template>
```

## Related

- [CodeSandbox Playground](https://codesandbox.io/p/devbox/thirsty-dawn-t2h69m)

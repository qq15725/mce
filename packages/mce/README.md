<h1 align="center">ModernCanvasEditor</h1>

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

<p align="center">An infinite canvas editor framework (Vue 3 + TypeScript) with real-time collaboration, a timeline, components and design tokens — built on WebGL rendering. Bring your own UI. ESM only.</p>

<p align="center">
  <a href="https://qq15725.github.io/mce/">📚 Documentation</a>
  &nbsp;·&nbsp;
  <a href="https://codesandbox.io/p/github/qq15725/mce/main">🎮 Try in CodeSandbox</a>
</p>

## ✨ Features

**Canvas & editing**
- Infinite canvas with pan / zoom, rulers, scrollbars, pixel grid and checkerboard
- Smart guides & snapping, alignment / distribution, z-order arrange, tidy-up
- Multi-select & marquee, transform (move / resize / rotate / flip), foreground crop
- Frames (artboards) with auto-nesting, and Flex auto-layout (drag-to-reorder)

**Content**
- Shapes, pen / freehand paths, lines & arrows
- Rich text (fragment styling, custom fonts, format painter, auto-fit strategies)
- Images (insert / upload / crop), video, tables and charts

**Motion**
- Timeline with frame-based playback
- Keyframe animation with reusable easing (presets + custom cubic-bezier)
- Export to GIF, MP4 and Lottie

**Collaboration & history**
- Real-time multi-user editing via [Yjs](https://github.com/yjs/yjs) CRDT (WebSocket provider)
- Offline persistence (IndexedDB) and awareness (remote cursors / selection)
- Undo / redo integrated with the CRDT history

**Design systems**
- Components / symbols / instances with per-instance overrides and master propagation
- Design tokens / variables (collections + modes) for theming and responsive values

**AI**
- A typed AI canvas action schema — drive edits from an LLM over the existing command & undo stack (model wiring left to the consumer)

**Extensible**
- 45+ built-in plugins; a plugin can contribute commands, tools, hotkeys, exporters, loaders, components and events
- Unified command system, hotkeys, and i18n

## 📤 Export formats

`PNG` · `JPEG` · `WebP` · `SVG` · `PDF` · `GIF` · `MP4` · `Lottie` · `PPTX` / `XLSX` / `DOCX` · `JSON`

Format exporters ship as optional plugins:

| Package | Formats |
| --- | --- |
| `@mce/gif` | GIF |
| `@mce/mp4` | MP4 |
| `@mce/pdf` | PDF |
| `@mce/svg` | SVG |
| `@mce/openxml` | PPTX / XLSX / DOCX |
| `@mce/psd` | PSD import (Photoshop layers → elements) |

(`PNG` / `JPEG` / `WebP` / `JSON` / `Lottie` are built in.)

## 📦 Install

```shell
npm i mce
```

## 🦄 Usage

```vue
<script setup lang="ts">
  import { Editor, EditorLayout, EditorLayoutItem } from 'mce'
  import 'mce/styles'
  import gif from '@mce/gif'
  import mp4 from '@mce/mp4'
  import openxml from '@mce/openxml'
  import pdf from '@mce/pdf'
  import svg from '@mce/svg'

  const editor = new Editor({
    plugins: [
      gif(),
      mp4(),
      svg(),
      pdf(),
      openxml(),
    ],
    // @mce/gif bundles its encoding worker by default. To self-host it
    // (e.g. under a strict CSP), pass `gifWorkerUrl` explicitly:
    //   import gifWorkerUrl from 'modern-gif/worker?url'
    //   ...new Editor({ gifWorkerUrl })
    locale: { locale: 'en' },
    viewport: {
      camera: { enabled: true },
      zoom: { strategy: 'contain' },
      screenPadding: { left: 0, top: 0, right: 0, bottom: 0 },
    },
    canvas: {
      checkerboard: { enabled: true, style: 'grid' },
      pixelGrid: { enabled: true },
      frame: { outline: false },
      watermark: {
        url: '/example.jpg',
        width: 100,
        alpha: 0.05,
        rotation: 0.5236,
      },
    },
    ui: {
      ruler: { visible: true },
      scrollbar: { visible: true },
      statusbar: { visible: true },
      toolbelt: { visible: true },
      madeWith: { visible: false },
    },
    typography: {
      strategy: 'autoHeight',
      defaultFont: {
        family: 'SourceHanSansCN-Normal',
        src: '/fonts/SourceHanSansCN-Normal.woff',
      },
    },
    customUpload: async (blob) => URL.createObjectURL(blob),
    customContextMenu: (menu) => menu,
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

  editor.on('docSet', () => {
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
      <template #selection />
      <template #floatbar />
      <template #drawboard />
      <EditorLayoutItem position="top" :size="56" />
      <EditorLayoutItem position="left" :size="380" />
      <EditorLayoutItem position="right" :size="260" />
    </EditorLayout>
  </div>
</template>
```

Slot sub component — read editor state via `useEditor()`:

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

## 🧩 Commands

Everything the editor does is a command — call `editor.exec(name, ...args)`. A few examples:

```ts
// Arrange & layout
editor.exec('alignHorizontalCenter')
editor.exec('distributeHorizontalSpacing')
editor.exec('tidyUp')

// Design tokens / variables
const collection = editor.exec('createVariableCollection', 'Theme', 'Light')
const dark = editor.exec('addVariableMode', collection, 'Dark')
const brand = editor.exec('addVariable', collection, { name: 'brand', type: 'color', value: '#ff0000' })
editor.exec('setVariableValue', brand, dark, '#0000ff')
editor.exec('bindVariable', 'fill.color', brand) // bind selected element's fill
editor.exec('setActiveVariableMode', collection, dark) // theme switch → canvas recolors

// Components / instances
const component = editor.exec('createComponent') // from selection
editor.exec('createInstance', component, { position: { x: 200, y: 200 } })

// Keyframe animation → Lottie
editor.exec('addAnimationKeyframe', 0, { left: 0, opacity: 0 })
editor.exec('addAnimationKeyframe', 1, { left: 300, opacity: 1 })
const lottie = editor.exec('exportLottie')

// AI canvas actions (validated, applied in one undo step)
editor.exec('applyAiActions', [
  { type: 'createText', text: 'Hello', x: 40, y: 40 },
  { type: 'align', direction: 'left' },
])
```

## 🏗️ Architecture

```
packages/
  mce/        # core editor library (npm: mce)
  gif/        # GIF export  (@mce/gif)
  mp4/        # MP4 export  (@mce/mp4)
  pdf/        # PDF export  (@mce/pdf)
  svg/        # SVG export  (@mce/svg)
  openxml/    # PPTX/XLSX/DOCX  (@mce/openxml)
playground/   # demo & test app
```

The `Editor` is composed from layered mixins and a plugin system. Rendering is powered by
[`modern-canvas`](https://www.npmjs.com/package/modern-canvas) (WebGL), with text / fonts /
document model from `modern-text`, `modern-font` and `modern-idoc`. Collaboration is built on
`yjs` + `y-protocols`.

## 🛠️ Development

```shell
pnpm dev            # start the playground
pnpm build          # build core + all plugins
pnpm test           # run tests
pnpm -F mce typecheck
pnpm lint
```

## 📄 License

[MIT](./LICENSE)

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
- Frames (artboards) with auto-nesting, and Flex auto-layout (drag-to-reorder) via `@mce/flex`

**Content**
- Shapes, pen / freehand paths, lines & arrows
- Rich text (fragment styling, custom fonts, format painter, auto-fit strategies)
- Images (insert / upload / crop), video, tables (`@mce/table`) and charts (`@mce/chart`)

**Motion**
- Timeline with frame-based playback
- Keyframe animation with reusable easing (presets + custom cubic-bezier)
- Export to GIF, MP4 and Lottie

**Collaboration & history**
- CRDT document model ([Yjs](https://github.com/yjs/yjs)) in the core — undo / redo and offline persistence (IndexedDB) build on it
- Real-time multi-user editing + awareness (remote cursors / selection / avatars) via `@mce/collaboration` (WebSocket / pluggable transport)
- Comments anchored to elements (pins follow on move / scale / rotate, threads with replies & resolve) via `@mce/comments`

**Design systems**
- Components / symbols / instances with per-instance overrides and master propagation
- Design tokens / variables (collections + modes) for theming and responsive values

**AI** (`@mce/ai`)
- A typed AI canvas action schema — drive edits from an LLM over the existing command & undo stack (model wiring left to the consumer)

**Workflow** (`@mce/workflow`)
- A node-graph editing mode: connectable nodes with input / output ports and curved connections

**Extensible**
- ~40 built-in plugins; a plugin can contribute commands, tools, hotkeys, exporters, loaders, components and events
- Element types & modes are decoupled via extension points (selection redirect, resize override, enter handler, editing state, toolbelt item, icon, mode, statusbar item) — see `mixins/extensions.ts`
- Unified command system, hotkeys, and i18n

## 📤 Import & export

- **Export**: `PNG` · `JPEG` · `WebP` · `SVG` · `PDF` · `GIF` · `MP4` · `Lottie` · `PPTX` / `XLSX` / `DOCX` · `JSON`
- **Import**: `PPTX` / `XLSX` / `DOCX` · `PSD` · `SVG` · `HTML` · images · `JSON`

These ship as optional plugins; their heavy encoders / parsers are lazy-loaded on first use:

| Package | Adds |
| --- | --- |
| `@mce/gif` | GIF export |
| `@mce/mp4` | MP4 export |
| `@mce/pdf` | PDF export |
| `@mce/svg` | SVG import & export |
| `@mce/openxml` | PPTX / XLSX / DOCX import & export |
| `@mce/psd` | PSD import (Photoshop layers → elements) |
| `@mce/html` | HTML import |

(`PNG` / `JPEG` / `WebP` / `JSON` / `Lottie` export are built in.)

## 🔌 Feature plugins

Specialized features also ship as optional packages, registered the same way (`plugins: [...]`):

| Package | Adds |
| --- | --- |
| `@mce/table` | Table element + in-canvas table editor |
| `@mce/chart` | Chart elements (bar / line / pie / …) |
| `@mce/ai` | Typed AI canvas action schema (`applyAi`) |
| `@mce/workflow` | Node-graph editing mode |
| `@mce/collaboration` | Real-time collaboration: transport providers + presence (cursors / selection / avatars) |
| `@mce/comments` | Comments: comment tool + pins anchored to elements + threads (stored on `element.comments`) |
| `@mce/flex` | Flex / auto-layout: container-level flex commands + drag-to-reorder children (loads the yoga layout engine on demand) |

## 📦 Install

```shell
npm i mce
```

## 🦄 Usage

```vue
<script setup lang="ts">
  import { Editor, EditorLayout, EditorLayoutItem } from 'mce'
  import 'mce/styles'
  // Plugins that ship UI components export their own stylesheet — import it or
  // their editor styles (chart / table / comments / presence / workflow) are missing.
  import '@mce/chart/styles'
  import '@mce/collaboration/styles'
  import '@mce/comments/styles'
  import '@mce/flex/styles'
  import '@mce/table/styles'
  import '@mce/workflow/styles'
  import ai from '@mce/ai'
  import chart from '@mce/chart'
  import collaboration from '@mce/collaboration'
  import comments from '@mce/comments'
  import flex from '@mce/flex'
  import gif from '@mce/gif'
  import mp4 from '@mce/mp4'
  import openxml from '@mce/openxml'
  import pdf from '@mce/pdf'
  import svg from '@mce/svg'
  import table from '@mce/table'
  import workflow from '@mce/workflow'

  const editor = new Editor({
    plugins: [
      // export / import formats
      gif(),
      mp4(),
      svg(),
      pdf(),
      openxml(),
      // feature plugins (all optional)
      table(),
      chart(),
      ai(),
      workflow(),
      collaboration(), // registers the collaboration + presence plugins
      comments(),
      flex(), // loads the yoga layout engine on setup
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
    uploader: async (blob) => URL.createObjectURL(blob),
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
const dark = editor.exec('createVariableMode', collection, 'Dark')
const brand = editor.exec('createVariable', collection, { name: 'brand', type: 'color', value: '#ff0000' })
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

// AI canvas actions (validated, applied in one undo step) — needs @mce/ai
editor.exec('applyAi', [
  { type: 'createText', text: 'Hello', x: 40, y: 40 },
  { type: 'align', direction: 'left' },
])
```

## 🤖 AI

`@mce/ai` ships a **typed action layer**, not a model. It gives you a schema to
put in your prompt and a safe `applyAi` that validates / sanitizes a batch
of actions and applies them in a single undo step — wiring the LLM call is up to you.

**1. Register the plugin**

```ts
import ai from '@mce/ai'
new Editor({ plugins: [ai()] })
```

**2. Build the prompt — `getAiPrompt` assembles schema + node ids + request for you**

```ts
const prompt = editor.exec('getAiPrompt', userInput)
// Already includes the action schema and every existing node id (so the model can
// reference current elements). Need the raw schema instead? editor.exec('getAiSchema').
```

**3. Call your own model, then apply the returned actions**

```ts
// ← your LLM / SDK; @mce/ai is model-agnostic
const text = await callYourLLM(prompt)
const actions = JSON.parse(text) // e.g. [{ type: 'createText', text: 'Hi', x: 40, y: 40 }]

const { created, errors } = editor.exec('applyAi', actions)
// created: ids of newly created elements
// errors:  rejected actions + reasons (invalid fields / unknown node ids) — skipped, not applied
```

- **Model-agnostic** — any LLM / SDK works as long as it emits schema-conforming JSON.
- **Safe** — invalid actions (bad fields, unknown ids) are rejected into `errors`, never written to the document.
- **One undo step** — the whole batch is a single undo entry.
- **Node ids included** — `getAiPrompt` embeds all current node ids, so actions referencing existing elements (`setStyle` / `move` / `delete` / `select` / `duplicate` / `align(ids)`) validate; building the prompt yourself means adding them manually.

## 🤝 Collaboration

The CRDT document model (Yjs) lives in the **core** — undo / redo and offline
persistence (IndexedDB) build on it. The **network transport and presence**
(awareness) layer is the optional `@mce/collaboration` package.

**1. Register the plugin**

```ts
import collaboration from '@mce/collaboration'

const editor = new Editor({
  plugins: [
    collaboration(), // registers the collaboration + presence plugins
  ],
})
```

**2. Identify the local user (presence)**

```ts
editor.presence.setUser({
  id: 'u-1', // optional, for dedupe / avatars
  name: 'Alice',
  color: '#E64980',
  avatar: 'https://…', // optional
})
```

**3. Connect to a room**

```ts
// Built-in WebSocket transport (y-websocket compatible server)
editor.collaboration.connect({
  url: 'wss://your-server',
  room: 'doc-1', // defaults to the current document id
})

// …or a custom / pluggable transport (WebRTC, BroadcastChannel, …)
import { AbstractProvider } from '@mce/collaboration'
editor.collaboration.connect({
  provider: doc => new MyProvider(doc), // doc is the document's YDoc
})

editor.collaboration.disconnect() // end the session
```

You can also auto-connect on startup via the editor option:

```ts
new Editor({ collaboration: { url: 'wss://your-server', room: 'doc-1' } })
```

**4. Reactive status & remote peers**

```ts
editor.collaboration.connected // Ref<boolean> — transport connected
editor.collaboration.synced    // Ref<boolean> — first full sync done
editor.collaboration.active    // Ref<boolean> — a session is active
editor.presence.peers          // Ref<Peer[]> — remote users (cursor / selection / user)
editor.presence.localUser      // Ref<PresenceUser>
```

Remote cursors, selection boxes and a connection/avatars status-bar item render
automatically once a session is active. Document switching rebuilds the provider
on the new document's `YDoc`; the transport is bound per-document.

> Comments (`@mce/comments`) live on `element.comments` and are part of the
> document model, so they sync over the same session automatically.

## 📚 Packages

Every package ships as ESM and registers the same way (`new Editor({ plugins: [pkg()] })`).
The default export of each `@mce/*` package is its plugin function; commands it adds are
called via `editor.exec(name, …)` rather than imported.

| Package | Description | Key exports |
| --- | --- | --- |
| `mce` | Headless infinite-canvas editor core (WebGL; export to image / video / PPT). | `Editor`, `EditorLayout`, `EditorLayoutItem`, `EditorLayers`, `createShapeElement` / `createTextElement` / … factories, `useEditor` |
| `@mce/ai` | LLM-driven, typed canvas actions (`createText` / `createShape` / `setStyle` / `move` / `select` / `delete` / `duplicate` / `align`) applied in one undo step with automatic validation. | `plugin` (default); `validateAiActions`, `AI_ACTION_SCHEMA` (commands: `applyAi`, `getAiSchema`, `getAiPrompt`) |
| `@mce/bigesj` | Bigesj design-doc integration: font preloading, clipboard paste detection, and PPTX / XLSX / DOCX loading. | `plugin(options)` (default); `useFonts`, `bigeLoader`, `bidTidLoader`, `clipboardLoader` |
| `@mce/chart` | Bar / line / pie chart elements with a built-in data editor and toolbelt entry. | `plugin` (default); `createChartElement(type, options)` |
| `@mce/collaboration` | Real-time multi-user editing (Yjs CRDT) over a pluggable provider (built-in WebSocket, y-websocket compatible; swap for WebRTC / BroadcastChannel) plus presence (remote cursors / selection / avatars). | `plugin` (default, registers collaboration + presence); `collaborationPlugin`, `presencePlugin`, `AbstractProvider`, `WebsocketProvider` |
| `@mce/comments` | Anchored comments: pins anchored to elements that follow on move / scale / rotate, with thread replies / resolve / reopen / delete. | `plugin` (default); `useComments`, `createCommentsStore` |
| `@mce/gaoding` | Gaoding design-doc clipboard-paste support. | `plugin` (default); `clipboardLoader` |
| `@mce/gif` | GIF export (frame-by-frame render from timeline keyframes; `modern-gif` lazy-loaded). | `plugin` (default) |
| `@mce/html` | HTML file / MIME import — DOM converted into canvas elements. | `plugin` (default) |
| `@mce/mp4` | MP4 export (adaptive bitrate, 720p–2160p, 30fps; `modern-mp4` lazy-loaded). | `plugin` (default) |
| `@mce/openxml` | PPTX / XLSX / DOCX two-way import & export with smart layer & font mapping (`modern-openxml`). | `plugin` (default) |
| `@mce/pdf` | PDF export with page metadata (size / margins; `modern-pdf` lazy-loaded). | `plugin` (default) |
| `@mce/psd` | PSD import — Photoshop layers expanded into elements, layer canvases auto-uploaded as image assets. | `plugin` (default); `psdToFrame` |
| `@mce/svg` | SVG import & export (Path2D path sets + viewBox, multi-MIME copy). | `plugin` (default) |
| `@mce/table` | Table element + in-canvas editor (add / remove rows & columns, merge / split cells, style editing, zoom-aware grid, toolbelt entry). | `plugin` (default); `createTableElement(rows, cols, options)` |
| `@mce/workflow` | Node-graph editing mode (connectable nodes, templated node types, preset text / image / video generation nodes). | `plugin` (default); `getWorkflowPorts`, `toConnectionPoints`, `INPUT_PORT`, `OUTPUT_PORT` (commands: `addWorkflowNode`, `addWorkflowConnection`) |

## 🏗️ Architecture

```
packages/
  mce/           # core editor library (npm: mce)
  gif/           # GIF export  (@mce/gif)
  mp4/           # MP4 export  (@mce/mp4)
  pdf/           # PDF export  (@mce/pdf)
  svg/           # SVG import & export  (@mce/svg)
  openxml/       # PPTX/XLSX/DOCX import & export  (@mce/openxml)
  psd/           # PSD import  (@mce/psd)
  html/          # HTML import  (@mce/html)
  table/         # table element + editor  (@mce/table)
  chart/         # chart elements  (@mce/chart)
  ai/            # AI canvas actions  (@mce/ai)
  workflow/      # node-graph mode  (@mce/workflow)
  collaboration/ # real-time collaboration  (@mce/collaboration)
  comments/      # comments  (@mce/comments)
  bigesj/        # Bigesj design-doc integration  (@mce/bigesj)
  gaoding/       # Gaoding clipboard paste  (@mce/gaoding)
playground/      # demo & test app
```

The `Editor` is composed from layered mixins and a plugin system. Rendering is powered by
[`modern-canvas`](https://www.npmjs.com/package/modern-canvas) (WebGL), with text / fonts /
document model from `modern-text`, `modern-font` and `modern-idoc`.

The core stays lean: element types and editing modes are decoupled through extension points
(`mixins/extensions.ts`), so feature packages register their behavior instead of the core
hard-coding it. The CRDT document model (`yjs` + `y-protocols`) lives in the core; the
real-time transport and presence layer is the optional `@mce/collaboration` package.

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

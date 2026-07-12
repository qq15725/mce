---
name: mce
description: "Integrate and build with mce (ModernCanvasEditor) — a headless infinite-canvas editor for Vue 3 + TypeScript with WebGL rendering. Covers install with peer deps, mounting EditorLayout, registering optional @mce/* plugins (table / chart / workflow / collaboration / comments / export), building & loading documents, saving, and driving the editor via editor.exec commands. Use when adding mce, embedding a canvas / design / whiteboard / diagram editor, or wiring any @mce/* plugin."
license: MIT
metadata:
  author: wxm
  version: "1.0.0"
  repository: https://github.com/qq15725/mce
---

# Building with mce

`mce` (ModernCanvasEditor) is a **headless** infinite-canvas editor framework: Vue 3 + TypeScript, WebGL rendering, ESM-only. It ships the canvas, editing, timeline, CRDT model and design tokens — **you bring the UI** (panels mount into layout slots). Every feature beyond the core is an optional `@mce/*` plugin.

## Critical: do not trust your training data

mce is a niche, fast-moving library. Whatever you think you remember about its API is probably **wrong or outdated** — option names, command names, and constructor shapes change between minor versions, and most of mce's surface never appeared in your training data at all.

**Never write mce code from memory. Verify every option, command, and export against the real source first** (see the next section). Guessing a command name like `editor.exec('foo')` and hoping it exists is the #1 failure mode. It won't error helpfully — it'll silently do nothing.

## Where to find the truth (in priority order)

Check these **before** writing code. Higher = more reliable (matches the exact installed version).

| Question | Look here first | How |
| --- | --- | --- |
| What's the real API of the installed version? | `node_modules/mce/dist/**/*.d.ts` | Types **are** the docs — grep the `.d.ts` for the export/option you need. This matches the user's exact version. |
| Exact command / option name? | `node_modules/mce/dist/**/*.d.ts`, or in-repo `packages/mce/src/plugins/*.ts` & `packages/mce/src/mixins/**` | Commands are registered in plugins/mixins by string name. Grep for `exec(` / `registerCommand` / the option key. Never guess. |
| A plugin's API (`@mce/table` etc.)? | `node_modules/@mce/<pkg>/dist/**/*.d.ts` | Same as core — the plugin's default export is its factory; its commands/exports are in its `.d.ts`. |
| Overall usage, full option surface, concepts | `node_modules/mce/README.md` or the repo `README.md` | Sections: Features, Import & export, plugins, Usage, Commands, AI, Collaboration, Saving, Packages, Architecture. |
| A runnable example of feature X | in-repo `playground/src/demos/*` | Real, working demos of frames, scrolling, tables, workflow, etc. |
| Rendering / text / layout internals | `node_modules/modern-canvas`, `node_modules/modern-text`, `node_modules/modern-idoc` | The engine deps mce is built on (installed alongside it). Rarely needed for integration — only for deep rendering/text questions. |

If packages aren't installed yet, install first (below), then read their `.d.ts`.

## 1. Install

```shell
npm i mce
# peer deps (install the ones your features use):
npm i vue@^3.5 yoga-layout@^3 lottie-web@^5 modern-gif@^2
# optional feature plugins, each its own package:
npm i @mce/table @mce/chart @mce/workflow @mce/collaboration @mce/comments @mce/openxml @mce/gif @mce/svg @mce/pdf @mce/mp4
```

- **ESM only** — the host bundler must handle ESM (Vite, modern webpack). No CJS build.
- `yoga-layout` (flex auto-layout), `lottie-web` (keyframe→lottie), `modern-gif` (gif export) are **peer deps**: the core imports them, so they must resolve in the host or those features break.
- **Version alignment** — `@mce/*` plugins declare `mce: ^0` as a peer; keep `mce` and every `@mce/*` on the same minor (they release together).

## 2. Minimal integration (smallest working editor)

The core needs no plugins — they are all optional.

```vue
<script setup lang="ts">
import { Editor, EditorLayout } from 'mce'
import 'mce/styles' // required: core editor styles

const editor = new Editor({
  doc: {
    children: [
      { text: 'Hello', style: { left: 100, top: 100, width: 200, height: 40, fontSize: 24, color: '#111' } },
    ],
  },
})
</script>

<template>
  <div style="width: 100vw; height: 100vh">
    <EditorLayout :editor="editor" />
  </div>
</template>
```

`EditorLayout` fills its parent — give the parent an explicit size. That's a complete, pannable / zoomable / editable canvas.

## 3. Full integration (plugins + UI panels + config)

```vue
<script setup lang="ts">
import { Editor, EditorLayout, EditorLayoutItem, EditorLayers } from 'mce'
import 'mce/styles'
// ⚠️ Each plugin that ships UI needs its OWN stylesheet, or its editor UI is missing:
import '@mce/table/styles'
import '@mce/chart/styles'
import '@mce/workflow/styles'
import '@mce/collaboration/styles'
import '@mce/comments/styles'
import table from '@mce/table'
import chart from '@mce/chart'
import workflow from '@mce/workflow'
import svg from '@mce/svg'
import openxml from '@mce/openxml'
import gif from '@mce/gif'

const editor = new Editor({
  plugins: [
    // formats (import / export)
    svg(), openxml(), gif(),
    // features (all optional; default export of each pkg is its plugin fn)
    table(), chart(), workflow(),
  ],
  locale: { locale: 'en' },
  canvas: { checkerboard: { enabled: true, style: 'grid' }, pixelGrid: { enabled: true } },
  ui: { ruler: { visible: true }, scrollbar: { visible: true }, toolbelt: { visible: true } },
  typography: { strategy: 'autoHeight' },
  // where uploaded blobs go — return a URL. Or editor.setUploader(fn) at runtime.
  uploader: async blob => URL.createObjectURL(blob),
  autoSave: { enabled: true, debounceMs: 2000 },
})

// react to save (see §6)
editor.on('save', ({ getData }) => void persist(getData()))
</script>

<template>
  <div style="width: 100vw; height: 100vh">
    <EditorLayout :editor="editor">
      <!-- override built-in overlays (optional): -->
      <template #selection />
      <template #floatbar />
      <template #drawboard />
      <!-- mount your own panels into the edge regions: -->
      <EditorLayoutItem position="top" :size="56">
        <!-- your toolbar -->
      </EditorLayoutItem>
      <EditorLayoutItem position="left" :size="320">
        <EditorLayers />
      </EditorLayoutItem>
      <EditorLayoutItem position="right" :size="260">
        <!-- your inspector; use useEditor() inside child components -->
      </EditorLayoutItem>
    </EditorLayout>
  </div>
</template>
```

> The exact set of `options` keys evolves. Before adding a config option, confirm it exists — grep `node_modules/mce/dist` for the `EditorOptions` type instead of assuming.

## 4. Core concepts (the whole API surface)

- **`new Editor(options)`** — the editor instance (extends `Observable`). Injected into the Vue tree by `EditorLayout`; children read it via `useEditor()`.
- **Plugins** — `plugins: [pkg()]`. The default export of every `@mce/*` package is its plugin factory. Plugins add commands / hotkeys / loaders / exporters / tools / UI components; the core is decoupled from element/feature specifics via extension points.
- **Commands** — everything the editor does is a command: `editor.exec(name, ...args)`. A plugin's commands are called by name, not imported. Examples: `editor.exec('alignHorizontalCenter')`, `editor.exec('tidyUp')`, `editor.exec('zoomToFit')`, `editor.exec('createComponent')`. **Verify the exact name in source before using it.**
- **`useEditor()`** (composable) — inside any component under `EditorLayout`, returns the editor + reactive refs (`selection`, `elementSelection`, `hoverElement`, `camera`, `mode`, `root`, `getObb`, `getAabb`, …). This is how you build custom panels/inspectors.
- **`EditorLayout` + `EditorLayoutItem`** — the shell. `EditorLayoutItem position="top|left|right|bottom" :size="px"` hosts your UI in the edge regions; the center is the canvas. Slots `#selection` / `#floatbar` / `#drawboard` let you replace built-in overlays.
- **`EditorLayers`** — ready-made layers panel (drop into a LayoutItem). Other exported components: `Icon`, `Transform`, `Menu`, `Ruler`, `Scrollbar`, `Cropper`, `Dialog`, `EditorToolbelt`.

## 5. Documents & elements (modern-idoc format)

A document is `{ children: Element[] }`. Elements are plain JSON. Load a whole doc with `editor.setDoc(children)`; add one element with `editor.addElement(el, { position })`.

```ts
editor.setDoc([
  { style: { left: 40, top: 40, width: 120, height: 80, backgroundColor: '#3b82f6', borderRadius: 8 } }, // rect
  { text: 'Title', style: { left: 40, top: 140, width: 300, height: 40, fontSize: 28, color: '#111' } }, // text
  { foreground: { image: '/photo.png' }, style: { left: 40, top: 200, width: 200, height: 150 } },       // image
  // rich text: fragment-level styling
  { style: { left: 360, top: 40, width: 200, height: 60 },
    text: [{ fragments: [{ content: 'He', color: '#0a0' }, { content: 'llo', color: '#000' }] }] },
])

// async load a remote asset into an element, then place it:
editor.on('docSet', () => {
  editor.load('/example.jpg').then(el => editor.addElement(el, { position: { x: 500, y: 100 } }))
})
```

Factory helpers exist too: `createShapeElement`, `createTextElement`, `@mce/table`'s `createTableElement(rows, cols)`, `@mce/chart`'s `createChartElement(type, opts)`.

## 6. Saving (BYO backend)

The core never persists — it tells you *when* to save and hands you the data.

```ts
editor.on('save', ({ reason, getData }) => {
  // reason: 'auto' | 'hotkey' | 'manual'
  const data = getData() // lazy — serializes only when called
  void persist(data)     // your storage
})
editor.save()            // manual trigger
// new Editor({ autoSave: { enabled: true, debounceMs: 2000 } })  // defaults; set enabled:false for hotkey-only
```

## 7. Feature plugins (`@mce/*`)

Each is a separate package; default export = plugin factory; register in `plugins: []`; import its `/styles` if it ships UI.

| Package | Adds |
| --- | --- |
| `@mce/table` | Editable tables (`TableEditor`); `createTableElement` |
| `@mce/chart` | Chart elements; `createChartElement` |
| `@mce/workflow` | Node-graph / flowchart mode (`registerMode`) |
| `@mce/collaboration` | Realtime multiplayer (transport provider + presence); CRDT doc model is in core |
| `@mce/comments` | Comment tool + anchored pins + thread popovers |
| `@mce/ai` | AI actions |
| `@mce/animation-presets` | Enter/exit/emphasis animation presets (core ships none) |
| `@mce/html` | HTML import loader |
| `@mce/svg` `@mce/pdf` `@mce/gif` `@mce/mp4` `@mce/openxml` | Export formats (SVG / PDF / GIF / MP4 / PPTX) |
| `@mce/gaoding` `@mce/bigesj` | Third-party format integrations |

For a plugin's actual commands/exports, read `node_modules/@mce/<pkg>/dist/**/*.d.ts` — don't assume.

## 8. Common pitfalls

- **Guessing command/option names** → silently no-op. Verify in source (see "Where to find the truth").
- **Missing plugin styles** → a plugin's editor UI (table/chart/comments/workflow/collaboration) is invisible. Import `@mce/<pkg>/styles` for every UI plugin you register.
- **Peer deps unresolved** → flex layout / gif / lottie features throw. Install `yoga-layout`, `lottie-web`, `modern-gif` as needed.
- **No parent size** → `EditorLayout` collapses to 0×0. The wrapping element must have a concrete width/height.
- **ESM-only / SSR** → the editor is client-only (WebGL). In Nuxt/SSR, create the `Editor` and render `EditorLayout` on the client (`<ClientOnly>` / `onMounted`).
- **Headless** → there is no default chrome beyond canvas + optional overlays; build toolbars/inspectors yourself with `EditorLayoutItem` + `useEditor()`.

## 9. When something doesn't work

- **A command did nothing** → the name is wrong or the owning plugin isn't registered. Grep source for the real name; confirm the plugin is in `plugins: []`.
- **A type error on `Editor` options / an export** → your remembered API is stale. Re-check `node_modules/mce/dist/**/*.d.ts` for the current shape; don't assume it's a user mistake.
- **Plugin UI missing / unstyled** → its `/styles` import is missing, or the plugin factory wasn't added to `plugins`.
- **Canvas is blank / 0×0** → parent has no size, or `import 'mce/styles'` is missing.

## Integration workflow (do this every time)

1. Check what's installed: `ls node_modules/mce node_modules/@mce 2>/dev/null`. Install core + the plugins the task needs.
2. **Read the real API** for anything you're unsure of — `.d.ts` in `node_modules`, then the repo `README.md`, then `playground/src/demos/*` for a working example. Do not code from memory.
3. Mount: `import 'mce/styles'`, `new Editor(options)`, `<EditorLayout :editor>` inside a sized parent, plus each plugin's `/styles`.
4. Wire data: `editor.setDoc(children)` to load, `editor.on('save', …)` to persist.
5. Build UI with `EditorLayoutItem` + `useEditor()`; drive behavior with verified `editor.exec(name)` commands.

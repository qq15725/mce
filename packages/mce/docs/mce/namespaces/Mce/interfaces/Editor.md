[**mce**](../../../../README.md)

***

[mce](../../../../README.md) / [Mce](../README.md) / Editor

# Interface: Editor

Defined in: [packages/mce/src/mixins/0.command.ts:22](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/0.command.ts#L22)

## Properties

### aabbToDrawboardAabb()

> **aabbToDrawboardAabb**: (`aabb`) => `Aabb2D`

Defined in: [packages/mce/src/mixins/2.box.ts:15](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/2.box.ts#L15)

#### Parameters

##### aabb

`Aabb2D`

#### Returns

`Aabb2D`

***

### activateTool()

> **activateTool**: (`tool`) => `void`

Defined in: [packages/mce/src/mixins/tool.ts:27](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/tool.ts#L27)

#### Parameters

##### tool

`string` | `undefined`

#### Returns

`void`

***

### activeTool

> **activeTool**: `Ref`\<[`Tool`](Tool.md)\>

Defined in: [packages/mce/src/mixins/tool.ts:24](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/tool.ts#L24)

***

### addElement()

> **addElement**: (`element`, `options?`) => `Element2D`

Defined in: [packages/mce/src/mixins/4.3.element.ts:30](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/4.3.element.ts#L30)

#### Parameters

##### element

`Element`

##### options?

[`AddElementOptions`](AddElementOptions.md)

#### Returns

`Element2D`

***

### addElements()

> **addElements**: (`element`, `options?`) => `Element2D`[]

Defined in: [packages/mce/src/mixins/4.3.element.ts:31](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/4.3.element.ts#L31)

#### Parameters

##### element

`Element`\<`Meta`\>[]

##### options?

[`AddElementOptions`](AddElementOptions.md)

#### Returns

`Element2D`[]

***

### assets

> **assets**: `Assets`

Defined in: [packages/mce/src/mixins/0.context.ts:36](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/0.context.ts#L36)

***

### camera

> **camera**: `Ref`\<`Camera2D`\>

Defined in: [packages/mce/src/mixins/0.context.ts:39](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/0.context.ts#L39)

***

### canLoad()

> **canLoad**: (`source`) => `Promise`\<`boolean`\>

Defined in: [packages/mce/src/mixins/loader.ts:20](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/loader.ts#L20)

#### Parameters

##### source

`any`

#### Returns

`Promise`\<`boolean`\>

***

### canRedo

> **canRedo**: `Ref`\<`boolean`\>

Defined in: [packages/mce/src/plugins/history.ts:10](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/history.ts#L10)

***

### canUndo

> **canUndo**: `Ref`\<`boolean`\>

Defined in: [packages/mce/src/plugins/history.ts:9](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/history.ts#L9)

***

### captureElementScreenshot()

> **captureElementScreenshot**: (`element`) => `Promise`\<`HTMLCanvasElement`\>

Defined in: [packages/mce/src/mixins/snapshot.ts:10](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/snapshot.ts#L10)

#### Parameters

##### element

`Element2D` | `Element`\<`Meta`\>

#### Returns

`Promise`\<`HTMLCanvasElement`\>

***

### captureFrameScreenshot()

> **captureFrameScreenshot**: (`index`) => `void`

Defined in: [packages/mce/src/mixins/snapshot.ts:11](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/snapshot.ts#L11)

#### Parameters

##### index

`number`

#### Returns

`void`

***

### clearDoc()

> **clearDoc**: () => `void`

Defined in: [packages/mce/src/plugins/doc.ts:30](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/doc.ts#L30)

#### Returns

`void`

***

### commands

> **commands**: `Reactive`\<`Map`\<`string`, [`Command`](Command.md)\>\>

Defined in: [packages/mce/src/mixins/0.command.ts:23](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/0.command.ts#L23)

***

### contextMenu

> **contextMenu**: `ComputedRef`\<[`MenuItem`](MenuItem.md)[]\>

Defined in: [packages/mce/src/plugins/menu.ts:19](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/menu.ts#L19)

***

### copiedData

> **copiedData**: `Ref`\<`any`\>

Defined in: [packages/mce/src/plugins/edit.ts:39](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/edit.ts#L39)

***

### currentTime

> **currentTime**: `WritableComputedRef`\<`number`\>

Defined in: [packages/mce/src/mixins/1.timeline.ts:11](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/1.timeline.ts#L11)

***

### docLoading

> **docLoading**: `Ref`\<`boolean`\>

Defined in: [packages/mce/src/mixins/0.context.ts:47](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/0.context.ts#L47)

***

### drawboardAabb

> **drawboardAabb**: `Ref`\<`Aabb2D`\>

Defined in: [packages/mce/src/mixins/0.context.ts:43](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/0.context.ts#L43)

***

### drawboardContextMenuPointer

> **drawboardContextMenuPointer**: `Ref`\<`Vector2` \| `undefined`\>

Defined in: [packages/mce/src/mixins/0.context.ts:45](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/0.context.ts#L45)

***

### drawboardDom

> **drawboardDom**: `Ref`\<`HTMLElement` \| `undefined`\>

Defined in: [packages/mce/src/mixins/0.context.ts:42](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/0.context.ts#L42)

***

### drawboardEffect

> **drawboardEffect**: `Ref`\<`DrawboardEffect`\>

Defined in: [packages/mce/src/mixins/0.context.ts:40](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/0.context.ts#L40)

***

### drawboardPointer

> **drawboardPointer**: `Ref`\<`Vector2` \| `undefined`\>

Defined in: [packages/mce/src/mixins/0.context.ts:44](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/0.context.ts#L44)

***

### elementSelection

> **elementSelection**: `Ref`\<`Element2D`[]\>

Defined in: [packages/mce/src/mixins/0.context.ts:52](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/0.context.ts#L52)

***

### endTime

> **endTime**: `WritableComputedRef`\<`number`\>

Defined in: [packages/mce/src/mixins/1.timeline.ts:13](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/1.timeline.ts#L13)

***

### exec()

> **exec**: \<`K`\>(`command`, ...`args`) => `ReturnType`\<[`Commands`](Commands.md)\[`K`\]\>

Defined in: [packages/mce/src/mixins/0.command.ts:26](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/0.command.ts#L26)

#### Type Parameters

##### K

`K` *extends* keyof [`Commands`](Commands.md)

#### Parameters

##### command

`K`

##### args

...`Parameters`\<[`Commands`](Commands.md)\[`K`\]\>

#### Returns

`ReturnType`\<[`Commands`](Commands.md)\[`K`\]\>

***

### export()

> **export**: \<`K`\>(`name`, `options?`) => [`Exporters`](Exporters.md)\[`K`\]

Defined in: [packages/mce/src/mixins/exporter.ts:29](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/exporter.ts#L29)

#### Type Parameters

##### K

`K` *extends* keyof [`Exporters`](Exporters.md)

#### Parameters

##### name

`K`

##### options?

[`ExportOptions`](ExportOptions.md)

#### Returns

[`Exporters`](Exporters.md)\[`K`\]

***

### exportConfig()

> **exportConfig**: () => `Blob`

Defined in: [packages/mce/src/mixins/0.config.ts:22](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/0.config.ts#L22)

#### Returns

`Blob`

***

### exporters

> **exporters**: `Reactive`\<`Map`\<`string`, [`Exporter`](Exporter.md)\>\>

Defined in: [packages/mce/src/mixins/exporter.ts:26](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/exporter.ts#L26)

***

### exporting

> **exporting**: `Ref`\<`boolean`\>

Defined in: [packages/mce/src/mixins/exporter.ts:31](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/exporter.ts#L31)

***

### exportProgress

> **exportProgress**: `Ref`\<`number`\>

Defined in: [packages/mce/src/mixins/exporter.ts:32](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/exporter.ts#L32)

***

### findFrame()

> **findFrame**: (`target`) => `Element2D` \| `undefined`

Defined in: [packages/mce/src/mixins/4.2.frame.ts:7](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/4.2.frame.ts#L7)

#### Parameters

##### target

`"next"` | `"previous"`

#### Returns

`Element2D` \| `undefined`

***

### findSibling()

> **findSibling**: (`target`) => `Node` \| `undefined`

Defined in: [packages/mce/src/mixins/4.0.node.ts:7](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/4.0.node.ts#L7)

#### Parameters

##### target

`"next"` | `"previous"`

#### Returns

`Node` \| `undefined`

***

### fonts

> **fonts**: `Fonts`

Defined in: [packages/mce/src/mixins/0.context.ts:35](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/0.context.ts#L35)

***

### frames

> **frames**: `ComputedRef`\<`Element2D`[]\>

Defined in: [packages/mce/src/mixins/1.frame.ts:17](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/1.frame.ts#L17)

***

### frameThumbs

> **frameThumbs**: `Ref`\<[`FrameThumb`](FrameThumb.md)[]\>

Defined in: [packages/mce/src/mixins/1.frame.ts:16](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/1.frame.ts#L16)

***

### getAabb()

> **getAabb**: (`node`, `inTarget?`) => `Aabb2D`

Defined in: [packages/mce/src/mixins/2.box.ts:14](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/2.box.ts#L14)

#### Parameters

##### node

`Node` | `Node`[] | `undefined`

##### inTarget?

`"parent"` | `"drawboard"` | `"frame"`

#### Returns

`Aabb2D`

***

### getAncestorFrame()

> **getAncestorFrame**: (`node?`, `isTop?`) => `Element2D` \| `undefined`

Defined in: [packages/mce/src/mixins/1.frame.ts:18](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/1.frame.ts#L18)

#### Parameters

##### node?

`Node`

##### isTop?

`boolean`

#### Returns

`Element2D` \| `undefined`

***

### getConfig()

> **getConfig**: (`path`, `defaultValue?`) => `any`

Defined in: [packages/mce/src/mixins/0.config.ts:17](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/0.config.ts#L17)

#### Parameters

##### path

`string`

##### defaultValue?

`any`

#### Returns

`any`

***

### getConfigRef()

> **getConfigRef**: \<`T`\>(`path`) => `WritableComputedRef`\<`T`\>

Defined in: [packages/mce/src/mixins/0.config.ts:19](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/0.config.ts#L19)

#### Type Parameters

##### T

`T` = `any`

#### Parameters

##### path

`string`

#### Returns

`WritableComputedRef`\<`T`\>

***

### getDoc()

> **getDoc**: () => [`JsonData`](JsonData.md)

Defined in: [packages/mce/src/plugins/doc.ts:27](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/doc.ts#L27)

#### Returns

[`JsonData`](JsonData.md)

***

### getGlobalPointer()

> **getGlobalPointer**: () => `Vector2Like`

Defined in: [packages/mce/src/mixins/0.context.ts:56](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/0.context.ts#L56)

#### Returns

`Vector2Like`

***

### getKbd()

> **getKbd**: (`command`) => `string`

Defined in: [packages/mce/src/mixins/hotkey.ts:44](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/hotkey.ts#L44)

#### Parameters

##### command

`string`

#### Returns

`string`

***

### getObb()

> **getObb**: (`node`, `inTarget?`) => `Obb2D`

Defined in: [packages/mce/src/mixins/2.box.ts:12](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/2.box.ts#L12)

#### Parameters

##### node

`Node` | `Node`[] | `undefined`

##### inTarget?

`"parent"` | `"drawboard"` | `"frame"`

#### Returns

`Obb2D`

***

### getTimeRange()

> **getTimeRange**: (`node?`) => `object`

Defined in: [packages/mce/src/mixins/1.timeline.ts:14](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/1.timeline.ts#L14)

#### Parameters

##### node?

`Node` | `Node`[]

#### Returns

`object`

##### endTime

> **endTime**: `number`

##### startTime

> **startTime**: `number`

***

### hasTextSelectionRange

> **hasTextSelectionRange**: `Ref`\<`boolean`\>

Defined in: [packages/mce/src/plugins/typography.ts:32](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/typography.ts#L32)

***

### hotkeys

> **hotkeys**: `Reactive`\<`Map`\<`string`, [`Hotkey`](Hotkey.md)\>\>

Defined in: [packages/mce/src/mixins/hotkey.ts:41](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/hotkey.ts#L41)

***

### hotkeysData

> **hotkeysData**: `WritableComputedRef`\<[`HotkeyData`](HotkeyData.md)[]\>

Defined in: [packages/mce/src/mixins/hotkey.ts:40](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/hotkey.ts#L40)

***

### hoverElement

> **hoverElement**: `Ref`\<`Element2D` \| `undefined`\>

Defined in: [packages/mce/src/mixins/0.context.ts:54](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/0.context.ts#L54)

***

### http

> **http**: [`Http`](Http.md)

Defined in: [packages/mce/src/mixins/http.ts:42](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/http.ts#L42)

***

### importConfig()

> **importConfig**: () => `Promise`\<`void`\>

Defined in: [packages/mce/src/mixins/0.config.ts:21](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/0.config.ts#L21)

#### Returns

`Promise`\<`void`\>

***

### inEditorIs()

> **inEditorIs**: (`node`, `inEditorIs?`) => `boolean`

Defined in: [packages/mce/src/mixins/0.context.ts:61](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/0.context.ts#L61)

#### Parameters

##### node

`Node`

##### inEditorIs?

[`EditorNodeType`](../type-aliases/EditorNodeType.md)

#### Returns

`boolean`

***

### isElement()

> **isElement**: (`value`) => `value is Element2D`

Defined in: [packages/mce/src/mixins/0.context.ts:62](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/0.context.ts#L62)

#### Parameters

##### value

`any`

#### Returns

`value is Element2D`

***

### isFrameNode()

> **isFrameNode**: (`node`, `isTop?`) => `boolean`

Defined in: [packages/mce/src/mixins/0.context.ts:60](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/0.context.ts#L60)

#### Parameters

##### node

`Node`

##### isTop?

`boolean`

#### Returns

`boolean`

***

### isLock()

> **isLock**: (`node`) => `boolean`

Defined in: [packages/mce/src/mixins/0.context.ts:65](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/0.context.ts#L65)

#### Parameters

##### node

`Node`

#### Returns

`boolean`

***

### isNode()

> **isNode**: (`value`) => `value is Node`

Defined in: [packages/mce/src/mixins/0.context.ts:58](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/0.context.ts#L58)

#### Parameters

##### value

`any`

#### Returns

`value is Node`

***

### isPointerInSelection

> **isPointerInSelection**: `ComputedRef`\<`boolean`\>

Defined in: [packages/mce/src/mixins/2.box.ts:22](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/2.box.ts#L22)

***

### isRootNode()

> **isRootNode**: (`node`) => `boolean`

Defined in: [packages/mce/src/mixins/0.context.ts:59](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/0.context.ts#L59)

#### Parameters

##### node

`Node`

#### Returns

`boolean`

***

### isTextAllSelected

> **isTextAllSelected**: `Ref`\<`boolean`\>

Defined in: [packages/mce/src/plugins/typography.ts:33](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/typography.ts#L33)

***

### isVisible()

> **isVisible**: (`node`) => `boolean`

Defined in: [packages/mce/src/mixins/0.context.ts:63](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/0.context.ts#L63)

#### Parameters

##### node

`Node`

#### Returns

`boolean`

***

### load()

> **load**: \<`T`\>(`source`) => `Promise`\<`T`[]\>

Defined in: [packages/mce/src/mixins/loader.ts:21](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/loader.ts#L21)

#### Type Parameters

##### T

`T` = `NormalizedElement`\<`Meta`\>

#### Parameters

##### source

`any`

#### Returns

`Promise`\<`T`[]\>

***

### loadDoc()

> **loadDoc**: (`source`) => `Promise`\<`Doc`\>

Defined in: [packages/mce/src/plugins/doc.ts:29](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/doc.ts#L29)

#### Parameters

##### source

`any`

#### Returns

`Promise`\<`Doc`\>

***

### loaders

> **loaders**: `Reactive`\<`Map`\<`string`, [`Loader`](Loader.md)\>\>

Defined in: [packages/mce/src/mixins/loader.ts:17](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/loader.ts#L17)

***

### loadFont()

> **loadFont**: (`source`, `options?`) => `Promise`\<`FontLoadedResult`\>

Defined in: [packages/mce/src/mixins/0.font.ts:8](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/0.font.ts#L8)

#### Parameters

##### source

`FontSource`

##### options?

`FontLoadOptions`

#### Returns

`Promise`\<`FontLoadedResult`\>

***

### mainMenu

> **mainMenu**: `ComputedRef`\<[`MenuItem`](MenuItem.md)[]\>

Defined in: [packages/mce/src/plugins/menu.ts:18](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/menu.ts#L18)

***

### msPerPx

> **msPerPx**: `Ref`\<`number`\>

Defined in: [packages/mce/src/mixins/1.timeline.ts:10](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/1.timeline.ts#L10)

***

### newDoc()

> **newDoc**: () => `void`

Defined in: [packages/mce/src/plugins/doc.ts:31](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/doc.ts#L31)

#### Returns

`void`

***

### nodeIndexMap

> **nodeIndexMap**: `Map`\<`string`, `number`\>

Defined in: [packages/mce/src/mixins/0.context.ts:49](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/0.context.ts#L49)

***

### nodes

> **nodes**: `Ref`\<`Node`[]\>

Defined in: [packages/mce/src/mixins/0.context.ts:48](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/0.context.ts#L48)

***

### obbToDrawboardObb()

> **obbToDrawboardObb**: (`aabb`) => `Obb2D`

Defined in: [packages/mce/src/mixins/2.box.ts:13](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/2.box.ts#L13)

#### Parameters

##### aabb

`Obb2D`

#### Returns

`Obb2D`

***

### obbToFit()

> **obbToFit**: (`element`) => `void`

Defined in: [packages/mce/src/mixins/2.box.ts:11](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/2.box.ts#L11)

#### Parameters

##### element

`Element2D`

#### Returns

`void`

***

### openDoc()

> **openDoc**: () => `Promise`\<`void`\>

Defined in: [packages/mce/src/plugins/doc.ts:32](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/doc.ts#L32)

#### Returns

`Promise`\<`void`\>

***

### openFileDialog()

> **openFileDialog**: (`options?`) => `Promise`\<`File`[]\>

Defined in: [packages/mce/src/mixins/loader.ts:22](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/loader.ts#L22)

#### Parameters

##### options?

###### multiple?

`boolean`

#### Returns

`Promise`\<`File`[]\>

***

### parseAnchor()

> **parseAnchor**: (`anchor`, `isRtl?`) => [`ParsedAnchor`](../type-aliases/ParsedAnchor.md)

Defined in: [packages/mce/src/mixins/0.context.ts:57](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/0.context.ts#L57)

#### Parameters

##### anchor

[`Anchor`](../type-aliases/Anchor.md)

##### isRtl?

`boolean`

#### Returns

[`ParsedAnchor`](../type-aliases/ParsedAnchor.md)

***

### redo()

> **redo**: () => `void`

Defined in: [packages/mce/src/plugins/history.ts:12](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/history.ts#L12)

#### Returns

`void`

***

### registerCommand()

> **registerCommand**: (`value`) => `void`

Defined in: [packages/mce/src/mixins/0.command.ts:24](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/0.command.ts#L24)

#### Parameters

##### value

[`Command`](Command.md) | [`Command`](Command.md)[]

#### Returns

`void`

***

### registerConfig()

> **registerConfig**: \<`T`\>(`path`, `declaration?`) => `WritableComputedRef`\<`T`\>

Defined in: [packages/mce/src/mixins/0.config.ts:20](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/0.config.ts#L20)

#### Type Parameters

##### T

`T`

#### Parameters

##### path

`string`

##### declaration?

[`ConfigDeclaration`](ConfigDeclaration.md)\<`T`\>

#### Returns

`WritableComputedRef`\<`T`\>

***

### registerExporter()

> **registerExporter**: (`value`) => `void`

Defined in: [packages/mce/src/mixins/exporter.ts:27](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/exporter.ts#L27)

#### Parameters

##### value

[`Exporter`](Exporter.md) | [`Exporter`](Exporter.md)[]

#### Returns

`void`

***

### registerHotkey()

> **registerHotkey**: (`value`) => `void`

Defined in: [packages/mce/src/mixins/hotkey.ts:42](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/hotkey.ts#L42)

#### Parameters

##### value

[`Hotkey`](Hotkey.md) | [`Hotkey`](Hotkey.md)[]

#### Returns

`void`

***

### registerLoader()

> **registerLoader**: (`value`) => `void`

Defined in: [packages/mce/src/mixins/loader.ts:18](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/loader.ts#L18)

#### Parameters

##### value

[`Loader`](Loader.md) | [`Loader`](Loader.md)[]

#### Returns

`void`

***

### registerSnapper()

> **registerSnapper**: (`key`, `snapper`) => `void`

Defined in: [packages/mce/src/mixins/snapper.ts:20](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/snapper.ts#L20)

#### Parameters

##### key

`string`

##### snapper

[`Snapper`](Snapper.md)

#### Returns

`void`

***

### registerTool()

> **registerTool**: (`tool`) => `void`

Defined in: [packages/mce/src/mixins/tool.ts:25](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/tool.ts#L25)

#### Parameters

##### tool

[`Tool`](Tool.md) | [`Tool`](Tool.md)[]

#### Returns

`void`

***

### renderEngine

> **renderEngine**: `Ref`\<`Engine`\>

Defined in: [packages/mce/src/mixins/0.context.ts:37](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/0.context.ts#L37)

***

### resizeElement()

> **resizeElement**: (`element`, `newWidth`, `newHeight`, `options?`) => `void`

Defined in: [packages/mce/src/mixins/4.3.element.ts:32](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/4.3.element.ts#L32)

#### Parameters

##### element

`Element2D`

##### newWidth

`number`

##### newHeight

`number`

##### options?

[`ResizeElementOptions`](ResizeElementOptions.md)

#### Returns

`void`

***

### root

> **root**: `Ref`\<`Doc`\>

Defined in: [packages/mce/src/mixins/0.context.ts:46](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/0.context.ts#L46)

***

### rootAabb

> **rootAabb**: `ComputedRef`\<`Aabb2D`\>

Defined in: [packages/mce/src/mixins/2.box.ts:17](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/2.box.ts#L17)

***

### saveAsConfig()

> **saveAsConfig**: (`filename?`) => `void`

Defined in: [packages/mce/src/mixins/0.config.ts:23](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/0.config.ts#L23)

#### Parameters

##### filename?

`string`

#### Returns

`void`

***

### screenCenter

> **screenCenter**: `ComputedRef`\<\{ `x`: `number`; `y`: `number`; \}\>

Defined in: [packages/mce/src/mixins/1.screen.ts:21](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/1.screen.ts#L21)

***

### screenCenterOffset

> **screenCenterOffset**: `ComputedRef`\<`Required`\<[`ScreenPadding`](ScreenPadding.md)\>\>

Defined in: [packages/mce/src/mixins/1.screen.ts:20](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/1.screen.ts#L20)

***

### screenControlsOffset

> **screenControlsOffset**: `ComputedRef`\<`Required`\<[`ScreenPadding`](ScreenPadding.md)\>\>

Defined in: [packages/mce/src/mixins/1.screen.ts:19](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/1.screen.ts#L19)

***

### selection

> **selection**: `Ref`\<`Node`[]\>

Defined in: [packages/mce/src/mixins/0.context.ts:50](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/0.context.ts#L50)

***

### selectionAabb

> **selectionAabb**: `ComputedRef`\<`Aabb2D`\>

Defined in: [packages/mce/src/mixins/2.box.ts:18](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/2.box.ts#L18)

***

### selectionAabbInDrawboard

> **selectionAabbInDrawboard**: `ComputedRef`\<`Aabb2D`\>

Defined in: [packages/mce/src/mixins/2.box.ts:19](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/2.box.ts#L19)

***

### selectionMarquee

> **selectionMarquee**: `Ref`\<`Aabb2D`\>

Defined in: [packages/mce/src/mixins/0.context.ts:51](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/0.context.ts#L51)

***

### selectionObb

> **selectionObb**: `ComputedRef`\<`Obb2D`\>

Defined in: [packages/mce/src/mixins/2.box.ts:20](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/2.box.ts#L20)

***

### selectionObbInDrawboard

> **selectionObbInDrawboard**: `ComputedRef`\<`Aabb2D`\>

Defined in: [packages/mce/src/mixins/2.box.ts:21](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/2.box.ts#L21)

***

### setConfig()

> **setConfig**: (`path`, `value`) => `void`

Defined in: [packages/mce/src/mixins/0.config.ts:18](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/0.config.ts#L18)

#### Parameters

##### path

`string`

##### value

`any`

#### Returns

`void`

***

### setCursor()

> **setCursor**: (`mode`) => `void`

Defined in: [packages/mce/src/mixins/0.context.ts:41](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/0.context.ts#L41)

#### Parameters

##### mode

`string` | `undefined`

#### Returns

`void`

***

### setDefaultFont()

> **setDefaultFont**: (`source`, `options?`) => `Promise`\<`void`\>

Defined in: [packages/mce/src/mixins/0.font.ts:9](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/0.font.ts#L9)

#### Parameters

##### source

`FontSource`

##### options?

`FontLoadOptions`

#### Returns

`Promise`\<`void`\>

***

### setDoc()

> **setDoc**: (`doc`) => `Doc`

Defined in: [packages/mce/src/plugins/doc.ts:28](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/doc.ts#L28)

#### Parameters

##### doc

[`DocumentSource`](../type-aliases/DocumentSource.md)

#### Returns

`Doc`

***

### setLock()

> **setLock**: (`node`, `lock`) => `void`

Defined in: [packages/mce/src/mixins/0.context.ts:66](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/0.context.ts#L66)

#### Parameters

##### node

`Node`

##### lock

`boolean`

#### Returns

`void`

***

### setVisible()

> **setVisible**: (`node`, `visible`) => `void`

Defined in: [packages/mce/src/mixins/0.context.ts:64](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/0.context.ts#L64)

#### Parameters

##### node

`Node`

##### visible

`boolean`

#### Returns

`void`

***

### snap()

> **snap**: (`box`) => `void`

Defined in: [packages/mce/src/mixins/snapper.ts:22](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/snapper.ts#L22)

#### Parameters

##### box

###### height

`number`

###### left

`number`

###### top

`number`

###### width

`number`

#### Returns

`void`

***

### snappers

> **snappers**: `Reactive`\<`Map`\<`string`, [`Snapper`](Snapper.md)\>\>

Defined in: [packages/mce/src/mixins/snapper.ts:19](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/snapper.ts#L19)

***

### snapshot()

> **snapshot**: () => `void`

Defined in: [packages/mce/src/mixins/snapshot.ts:9](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/snapshot.ts#L9)

#### Returns

`void`

***

### startTime

> **startTime**: `WritableComputedRef`\<`number`\>

Defined in: [packages/mce/src/mixins/1.timeline.ts:12](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/1.timeline.ts#L12)

***

### state

> **state**: `Ref`\<[`State`](../type-aliases/State.md)\>

Defined in: [packages/mce/src/mixins/0.context.ts:55](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/0.context.ts#L55)

***

### t

> **t**: [`Translation`](../type-aliases/Translation.md)

Defined in: [packages/mce/src/mixins/0.locale.ts:12](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/0.locale.ts#L12)

***

### textSelection

> **textSelection**: `Ref`\<`IndexCharacter`[] \| `undefined`\>

Defined in: [packages/mce/src/mixins/0.context.ts:53](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/0.context.ts#L53)

***

### timeline

> **timeline**: `Ref`\<`Timeline`\>

Defined in: [packages/mce/src/mixins/0.context.ts:38](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/0.context.ts#L38)

***

### to()

> **to**: \<`K`\>(`name`, `options?`) => [`Exporters`](Exporters.md)\[`K`\]

Defined in: [packages/mce/src/mixins/exporter.ts:30](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/exporter.ts#L30)

#### Type Parameters

##### K

`K` *extends* keyof [`Exporters`](Exporters.md)

#### Parameters

##### name

`K`

##### options?

[`ExportOptions`](ExportOptions.md)

#### Returns

[`Exporters`](Exporters.md)\[`K`\]

***

### tools

> **tools**: `Reactive`\<`Map`\<`string`, [`Tool`](Tool.md)\>\>

Defined in: [packages/mce/src/mixins/tool.ts:23](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/tool.ts#L23)

***

### undo()

> **undo**: () => `void`

Defined in: [packages/mce/src/plugins/history.ts:11](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/history.ts#L11)

#### Returns

`void`

***

### unregisterCommand()

> **unregisterCommand**: (`command`) => `void`

Defined in: [packages/mce/src/mixins/0.command.ts:25](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/0.command.ts#L25)

#### Parameters

##### command

`string`

#### Returns

`void`

***

### unregisterExporter()

> **unregisterExporter**: (`name`) => `void`

Defined in: [packages/mce/src/mixins/exporter.ts:28](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/exporter.ts#L28)

#### Parameters

##### name

`string`

#### Returns

`void`

***

### unregisterHotkey()

> **unregisterHotkey**: (`command`) => `void`

Defined in: [packages/mce/src/mixins/hotkey.ts:43](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/hotkey.ts#L43)

#### Parameters

##### command

`string`

#### Returns

`void`

***

### unregisterLoader()

> **unregisterLoader**: (`name`) => `void`

Defined in: [packages/mce/src/mixins/loader.ts:19](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/loader.ts#L19)

#### Parameters

##### name

`string`

#### Returns

`void`

***

### unregisterSnapper()

> **unregisterSnapper**: (`key`) => `void`

Defined in: [packages/mce/src/mixins/snapper.ts:21](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/snapper.ts#L21)

#### Parameters

##### key

`string`

#### Returns

`void`

***

### unregisterTool()

> **unregisterTool**: (`tool`) => `void`

Defined in: [packages/mce/src/mixins/tool.ts:26](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/tool.ts#L26)

#### Parameters

##### tool

`string`

#### Returns

`void`

***

### upload

> **upload**: [`Upload`](../type-aliases/Upload.md)

Defined in: [packages/mce/src/mixins/1.upload.ts:8](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/1.upload.ts#L8)

***

### viewportAabb

> **viewportAabb**: `ComputedRef`\<`Aabb2D`\>

Defined in: [packages/mce/src/mixins/2.box.ts:16](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/2.box.ts#L16)

***

### waitUntilFontLoad()

> **waitUntilFontLoad**: () => `Promise`\<`void`\>

Defined in: [packages/mce/src/mixins/0.font.ts:10](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/0.font.ts#L10)

#### Returns

`Promise`\<`void`\>

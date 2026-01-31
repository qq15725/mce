[**mce**](../../../../README.md)

***

[mce](../../../../README.md) / [Mce](../README.md) / Editor

# Interface: Editor

Defined in: [packages/mce/src/mixins/0.command.ts:22](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/0.command.ts#L22)

## Properties

### aabbToDrawboardAabb()

> **aabbToDrawboardAabb**: (`aabb`) => `Aabb2D`

Defined in: [packages/mce/src/mixins/2.box.ts:15](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/2.box.ts#L15)

#### Parameters

##### aabb

`Aabb2D`

#### Returns

`Aabb2D`

***

### activeDrawingTool

> **activeDrawingTool**: `Ref`\<[`DrawingTool`](DrawingTool.md)\>

Defined in: [packages/mce/src/mixins/drawingTool.ts:24](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/drawingTool.ts#L24)

***

### addElement()

> **addElement**: (`element`, `options?`) => `Element2D`

Defined in: [packages/mce/src/mixins/4.3.element.ts:29](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/4.3.element.ts#L29)

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

Defined in: [packages/mce/src/mixins/4.3.element.ts:30](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/4.3.element.ts#L30)

#### Parameters

##### element

`Element`\<`Meta`\>[]

##### options?

[`AddElementOptions`](AddElementOptions.md)

#### Returns

`Element2D`[]

***

### addNode()

> **addNode**: (`value`, `options?`) => `Node`

Defined in: [packages/mce/src/mixins/4.0.node.ts:16](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/4.0.node.ts#L16)

#### Parameters

##### value

`Element`

##### options?

[`AddNodeOptions`](AddNodeOptions.md)

#### Returns

`Node`

***

### bindRenderCanvas()

> **bindRenderCanvas**: (`canvas`, `setEventTarget?`) => () => `void`

Defined in: [packages/mce/src/mixins/3.view.ts:6](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/3.view.ts#L6)

#### Parameters

##### canvas

`HTMLCanvasElement`

##### setEventTarget?

`HTMLElement`

#### Returns

> (): `void`

##### Returns

`void`

***

### camera

> **camera**: `Ref`\<`Camera2D`\>

Defined in: [packages/mce/src/mixins/0.context.ts:37](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/0.context.ts#L37)

***

### canLoad()

> **canLoad**: (`source`) => `Promise`\<`boolean`\>

Defined in: [packages/mce/src/mixins/2.load.ts:20](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/2.load.ts#L20)

#### Parameters

##### source

`any`

#### Returns

`Promise`\<`boolean`\>

***

### canRedo

> **canRedo**: `Ref`\<`boolean`\>

Defined in: [packages/mce/src/plugins/history.ts:9](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/plugins/history.ts#L9)

***

### canUndo

> **canUndo**: `Ref`\<`boolean`\>

Defined in: [packages/mce/src/plugins/history.ts:8](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/plugins/history.ts#L8)

***

### captureElementScreenshot()

> **captureElementScreenshot**: (`element`) => `Promise`\<`HTMLCanvasElement`\>

Defined in: [packages/mce/src/mixins/snapshot.ts:16](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/snapshot.ts#L16)

#### Parameters

##### element

`Element2D` | `Element`\<`Meta`\>

#### Returns

`Promise`\<`HTMLCanvasElement`\>

***

### captureFrameScreenshot()

> **captureFrameScreenshot**: (`index`) => `void`

Defined in: [packages/mce/src/mixins/snapshot.ts:17](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/snapshot.ts#L17)

#### Parameters

##### index

`number`

#### Returns

`void`

***

### clearDoc()

> **clearDoc**: () => `void`

Defined in: [packages/mce/src/mixins/4.4.doc.ts:25](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/4.4.doc.ts#L25)

#### Returns

`void`

***

### commands

> **commands**: `Reactive`\<`Map`\<`string`, [`Command`](Command.md)\>\>

Defined in: [packages/mce/src/mixins/0.command.ts:23](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/0.command.ts#L23)

***

### contextMenu

> **contextMenu**: `ComputedRef`\<[`MenuItem`](MenuItem.md)[]\>

Defined in: [packages/mce/src/plugins/menu.ts:19](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/plugins/menu.ts#L19)

***

### copiedData

> **copiedData**: `Ref`\<`any`\>

Defined in: [packages/mce/src/plugins/edit.ts:34](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/plugins/edit.ts#L34)

***

### currentTime

> **currentTime**: `WritableComputedRef`\<`number`\>

Defined in: [packages/mce/src/mixins/1.timeline.ts:11](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/1.timeline.ts#L11)

***

### doc

> **doc**: `Ref`\<`Doc`\>

Defined in: [packages/mce/src/mixins/0.context.ts:44](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/0.context.ts#L44)

***

### docLoading

> **docLoading**: `Ref`\<`boolean`\>

Defined in: [packages/mce/src/mixins/0.context.ts:45](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/0.context.ts#L45)

***

### drawboardAabb

> **drawboardAabb**: `Ref`\<`Aabb2D`\>

Defined in: [packages/mce/src/mixins/0.context.ts:41](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/0.context.ts#L41)

***

### drawboardContextMenuPointer

> **drawboardContextMenuPointer**: `Ref`\<`Vector2` \| `undefined`\>

Defined in: [packages/mce/src/mixins/0.context.ts:43](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/0.context.ts#L43)

***

### drawboardDom

> **drawboardDom**: `Ref`\<`HTMLElement` \| `undefined`\>

Defined in: [packages/mce/src/mixins/0.context.ts:40](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/0.context.ts#L40)

***

### drawboardEffect

> **drawboardEffect**: `Ref`\<`DrawboardEffect`\>

Defined in: [packages/mce/src/mixins/0.context.ts:38](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/0.context.ts#L38)

***

### drawboardPointer

> **drawboardPointer**: `Ref`\<`Vector2` \| `undefined`\>

Defined in: [packages/mce/src/mixins/0.context.ts:42](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/0.context.ts#L42)

***

### drawingTools

> **drawingTools**: `Reactive`\<`Map`\<`string`, [`DrawingTool`](DrawingTool.md)\>\>

Defined in: [packages/mce/src/mixins/drawingTool.ts:23](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/drawingTool.ts#L23)

***

### elementSelection

> **elementSelection**: `Ref`\<`Element2D`[]\>

Defined in: [packages/mce/src/mixins/0.context.ts:51](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/0.context.ts#L51)

***

### endTime

> **endTime**: `WritableComputedRef`\<`number`\>

Defined in: [packages/mce/src/mixins/1.timeline.ts:13](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/1.timeline.ts#L13)

***

### exec()

> **exec**: \<`K`\>(`command`, ...`args`) => `ReturnType`\<[`Commands`](Commands.md)\[`K`\]\>

Defined in: [packages/mce/src/mixins/0.command.ts:26](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/0.command.ts#L26)

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

Defined in: [packages/mce/src/mixins/2.export.ts:29](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/2.export.ts#L29)

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

Defined in: [packages/mce/src/mixins/0.config.ts:16](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/0.config.ts#L16)

#### Returns

`Blob`

***

### exporters

> **exporters**: `Reactive`\<`Map`\<`string`, [`Exporter`](Exporter.md)\>\>

Defined in: [packages/mce/src/mixins/2.export.ts:26](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/2.export.ts#L26)

***

### exporting

> **exporting**: `Ref`\<`boolean`\>

Defined in: [packages/mce/src/mixins/2.export.ts:31](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/2.export.ts#L31)

***

### exportProgress

> **exportProgress**: `Ref`\<`number`\>

Defined in: [packages/mce/src/mixins/2.export.ts:32](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/2.export.ts#L32)

***

### findFrame()

> **findFrame**: (`target`) => `Element2D` \| `undefined`

Defined in: [packages/mce/src/mixins/4.2.frame.ts:7](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/4.2.frame.ts#L7)

#### Parameters

##### target

`"next"` | `"previous"`

#### Returns

`Element2D` \| `undefined`

***

### findSibling()

> **findSibling**: (`target`) => `Node` \| `undefined`

Defined in: [packages/mce/src/mixins/4.0.node.ts:15](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/4.0.node.ts#L15)

#### Parameters

##### target

`"next"` | `"previous"`

#### Returns

`Node` \| `undefined`

***

### fonts

> **fonts**: `Fonts`

Defined in: [packages/mce/src/mixins/0.context.ts:34](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/0.context.ts#L34)

***

### frames

> **frames**: `ComputedRef`\<`Element2D`[]\>

Defined in: [packages/mce/src/mixins/1.frame.ts:17](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/1.frame.ts#L17)

***

### frameThumbs

> **frameThumbs**: `Ref`\<[`FrameThumb`](FrameThumb.md)[]\>

Defined in: [packages/mce/src/mixins/1.frame.ts:16](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/1.frame.ts#L16)

***

### getAabb()

> **getAabb**: (`node`, `inTarget?`) => `Aabb2D`

Defined in: [packages/mce/src/mixins/2.box.ts:14](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/2.box.ts#L14)

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

Defined in: [packages/mce/src/mixins/1.frame.ts:18](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/1.frame.ts#L18)

#### Parameters

##### node?

`Node`

##### isTop?

`boolean`

#### Returns

`Element2D` \| `undefined`

***

### getConfig()

> **getConfig**: \<`T`\>(`path`) => `WritableComputedRef`\<`T`\>

Defined in: [packages/mce/src/mixins/0.config.ts:13](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/0.config.ts#L13)

#### Type Parameters

##### T

`T` = `any`

#### Parameters

##### path

`string`

#### Returns

`WritableComputedRef`\<`T`\>

***

### getConfigValue()

> **getConfigValue**: (`path`, `defaultValue?`) => `any`

Defined in: [packages/mce/src/mixins/0.config.ts:11](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/0.config.ts#L11)

#### Parameters

##### path

`string`

##### defaultValue?

`any`

#### Returns

`any`

***

### getDoc()

> **getDoc**: () => [`JsonData`](JsonData.md)

Defined in: [packages/mce/src/mixins/4.4.doc.ts:22](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/4.4.doc.ts#L22)

#### Returns

[`JsonData`](JsonData.md)

***

### getGlobalPointer()

> **getGlobalPointer**: () => `Vector2Like`

Defined in: [packages/mce/src/mixins/0.context.ts:55](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/0.context.ts#L55)

#### Returns

`Vector2Like`

***

### getKbd()

> **getKbd**: (`command`) => `string`

Defined in: [packages/mce/src/mixins/1.hotkey.ts:44](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/1.hotkey.ts#L44)

#### Parameters

##### command

`string`

#### Returns

`string`

***

### getObb()

> **getObb**: (`node`, `inTarget?`) => `Obb2D`

Defined in: [packages/mce/src/mixins/2.box.ts:12](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/2.box.ts#L12)

#### Parameters

##### node

`Node` | `Node`[] | `undefined`

##### inTarget?

`"parent"` | `"drawboard"` | `"frame"`

#### Returns

`Obb2D`

***

### getSnapPoints()

> **getSnapPoints**: (`resizing?`) => `object`

Defined in: [packages/mce/src/plugins/smartGuides.ts:13](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/plugins/smartGuides.ts#L13)

#### Parameters

##### resizing?

`boolean`

#### Returns

`object`

##### x

> **x**: `number`[]

##### y

> **y**: `number`[]

***

### getTextFill()

> **getTextFill**: () => `NormalizedFill` \| `undefined`

Defined in: [packages/mce/src/mixins/4.1.text.ts:21](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/4.1.text.ts#L21)

#### Returns

`NormalizedFill` \| `undefined`

***

### getTextStyle()

> **getTextStyle**: (`key`) => `any`

Defined in: [packages/mce/src/mixins/4.1.text.ts:19](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/4.1.text.ts#L19)

#### Parameters

##### key

`string`

#### Returns

`any`

***

### getTimeRange()

> **getTimeRange**: (`node?`) => `object`

Defined in: [packages/mce/src/mixins/1.timeline.ts:14](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/1.timeline.ts#L14)

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

### handleTextSelection()

> **handleTextSelection**: (`textSelection`, `cb`) => `void`

Defined in: [packages/mce/src/mixins/4.1.text.ts:16](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/4.1.text.ts#L16)

#### Parameters

##### textSelection

`IndexCharacter`[]

##### cb

(`arg`) => `boolean`

#### Returns

`void`

***

### hasTextSelectionRange

> **hasTextSelectionRange**: `Ref`\<`boolean`\>

Defined in: [packages/mce/src/mixins/4.1.text.ts:14](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/4.1.text.ts#L14)

***

### hotkeys

> **hotkeys**: `Reactive`\<`Map`\<`string`, [`Hotkey`](Hotkey.md)\>\>

Defined in: [packages/mce/src/mixins/1.hotkey.ts:41](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/1.hotkey.ts#L41)

***

### hotkeysData

> **hotkeysData**: `WritableComputedRef`\<[`HotkeyData`](HotkeyData.md)[]\>

Defined in: [packages/mce/src/mixins/1.hotkey.ts:40](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/1.hotkey.ts#L40)

***

### hoverElement

> **hoverElement**: `Ref`\<`Element2D` \| `undefined`\>

Defined in: [packages/mce/src/mixins/0.context.ts:53](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/0.context.ts#L53)

***

### http

> **http**: [`Http`](Http.md)

Defined in: [packages/mce/src/mixins/http.ts:42](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/http.ts#L42)

***

### importConfig()

> **importConfig**: () => `Promise`\<`void`\>

Defined in: [packages/mce/src/mixins/0.config.ts:15](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/0.config.ts#L15)

#### Returns

`Promise`\<`void`\>

***

### inEditorIs()

> **inEditorIs**: (`node`, `inEditorIs?`) => `boolean`

Defined in: [packages/mce/src/mixins/0.context.ts:59](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/0.context.ts#L59)

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

Defined in: [packages/mce/src/mixins/0.context.ts:60](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/0.context.ts#L60)

#### Parameters

##### value

`any`

#### Returns

`value is Element2D`

***

### isFrame()

> **isFrame**: (`node`) => `boolean`

Defined in: [packages/mce/src/mixins/0.context.ts:61](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/0.context.ts#L61)

#### Parameters

##### node

`Node`

#### Returns

`boolean`

***

### isLock()

> **isLock**: (`node`) => `boolean`

Defined in: [packages/mce/src/mixins/0.context.ts:65](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/0.context.ts#L65)

#### Parameters

##### node

`Node`

#### Returns

`boolean`

***

### isNode()

> **isNode**: (`value`) => `value is Node`

Defined in: [packages/mce/src/mixins/0.context.ts:57](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/0.context.ts#L57)

#### Parameters

##### value

`any`

#### Returns

`value is Node`

***

### isPointerInSelection

> **isPointerInSelection**: `ComputedRef`\<`boolean`\>

Defined in: [packages/mce/src/mixins/2.box.ts:22](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/2.box.ts#L22)

***

### isRoot()

> **isRoot**: (`value`) => `value is Node`

Defined in: [packages/mce/src/mixins/0.context.ts:58](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/0.context.ts#L58)

#### Parameters

##### value

`any`

#### Returns

`value is Node`

***

### isTextAllSelected

> **isTextAllSelected**: `Ref`\<`boolean`\>

Defined in: [packages/mce/src/mixins/4.1.text.ts:15](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/4.1.text.ts#L15)

***

### isTopFrame()

> **isTopFrame**: (`node`) => `boolean`

Defined in: [packages/mce/src/mixins/0.context.ts:62](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/0.context.ts#L62)

#### Parameters

##### node

`Node`

#### Returns

`boolean`

***

### isVisible()

> **isVisible**: (`node`) => `boolean`

Defined in: [packages/mce/src/mixins/0.context.ts:63](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/0.context.ts#L63)

#### Parameters

##### node

`Node`

#### Returns

`boolean`

***

### load()

> **load**: \<`T`\>(`source`) => `Promise`\<`T`[]\>

Defined in: [packages/mce/src/mixins/2.load.ts:21](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/2.load.ts#L21)

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

Defined in: [packages/mce/src/mixins/4.4.doc.ts:24](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/4.4.doc.ts#L24)

#### Parameters

##### source

`any`

#### Returns

`Promise`\<`Doc`\>

***

### loaders

> **loaders**: `Reactive`\<`Map`\<`string`, [`Loader`](Loader.md)\>\>

Defined in: [packages/mce/src/mixins/2.load.ts:17](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/2.load.ts#L17)

***

### loadFont()

> **loadFont**: (`source`, `options?`) => `Promise`\<`FontLoadedResult`\>

Defined in: [packages/mce/src/mixins/0.font.ts:8](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/0.font.ts#L8)

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

Defined in: [packages/mce/src/plugins/menu.ts:18](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/plugins/menu.ts#L18)

***

### msPerPx

> **msPerPx**: `Ref`\<`number`\>

Defined in: [packages/mce/src/mixins/1.timeline.ts:10](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/1.timeline.ts#L10)

***

### nodeIndexMap

> **nodeIndexMap**: `Map`\<`string`, `number`\>

Defined in: [packages/mce/src/mixins/0.context.ts:48](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/0.context.ts#L48)

***

### nodes

> **nodes**: `Ref`\<`Node`[]\>

Defined in: [packages/mce/src/mixins/0.context.ts:47](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/0.context.ts#L47)

***

### obbToDrawboardObb()

> **obbToDrawboardObb**: (`aabb`) => `Obb2D`

Defined in: [packages/mce/src/mixins/2.box.ts:13](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/2.box.ts#L13)

#### Parameters

##### aabb

`Obb2D`

#### Returns

`Obb2D`

***

### obbToFit()

> **obbToFit**: (`element`) => `void`

Defined in: [packages/mce/src/mixins/2.box.ts:11](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/2.box.ts#L11)

#### Parameters

##### element

`Element2D`

#### Returns

`void`

***

### openFileDialog()

> **openFileDialog**: (`options?`) => `Promise`\<`File`[]\>

Defined in: [packages/mce/src/mixins/2.load.ts:22](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/2.load.ts#L22)

#### Parameters

##### options?

###### multiple?

`boolean`

#### Returns

`Promise`\<`File`[]\>

***

### parseAnchor()

> **parseAnchor**: (`anchor`, `isRtl?`) => [`ParsedAnchor`](../type-aliases/ParsedAnchor.md)

Defined in: [packages/mce/src/mixins/0.context.ts:56](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/0.context.ts#L56)

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

Defined in: [packages/mce/src/plugins/history.ts:11](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/plugins/history.ts#L11)

#### Returns

`void`

***

### registerCommand()

> **registerCommand**: (`value`) => `void`

Defined in: [packages/mce/src/mixins/0.command.ts:24](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/0.command.ts#L24)

#### Parameters

##### value

[`Command`](Command.md) | [`Command`](Command.md)[]

#### Returns

`void`

***

### registerConfig()

> **registerConfig**: \<`T`\>(`path`, `initValue`) => `WritableComputedRef`\<`T`\>

Defined in: [packages/mce/src/mixins/0.config.ts:14](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/0.config.ts#L14)

#### Type Parameters

##### T

`T`

#### Parameters

##### path

`string`

##### initValue

`T`

#### Returns

`WritableComputedRef`\<`T`\>

***

### registerDrawingTool()

> **registerDrawingTool**: (`tool`) => `void`

Defined in: [packages/mce/src/mixins/drawingTool.ts:25](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/drawingTool.ts#L25)

#### Parameters

##### tool

[`DrawingTool`](DrawingTool.md) | [`DrawingTool`](DrawingTool.md)[]

#### Returns

`void`

***

### registerExporter()

> **registerExporter**: (`value`) => `void`

Defined in: [packages/mce/src/mixins/2.export.ts:27](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/2.export.ts#L27)

#### Parameters

##### value

[`Exporter`](Exporter.md) | [`Exporter`](Exporter.md)[]

#### Returns

`void`

***

### registerHotkey()

> **registerHotkey**: (`value`) => `void`

Defined in: [packages/mce/src/mixins/1.hotkey.ts:42](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/1.hotkey.ts#L42)

#### Parameters

##### value

[`Hotkey`](Hotkey.md) | [`Hotkey`](Hotkey.md)[]

#### Returns

`void`

***

### registerLoader()

> **registerLoader**: (`value`) => `void`

Defined in: [packages/mce/src/mixins/2.load.ts:18](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/2.load.ts#L18)

#### Parameters

##### value

[`Loader`](Loader.md) | [`Loader`](Loader.md)[]

#### Returns

`void`

***

### renderEngine

> **renderEngine**: `Ref`\<`Engine`\>

Defined in: [packages/mce/src/mixins/0.context.ts:35](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/0.context.ts#L35)

***

### resizeElement()

> **resizeElement**: (`element`, `newWidth`, `newHeight`, `options?`) => `void`

Defined in: [packages/mce/src/mixins/4.3.element.ts:31](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/4.3.element.ts#L31)

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

> **root**: `ComputedRef`\<`Node`\>

Defined in: [packages/mce/src/mixins/0.context.ts:46](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/0.context.ts#L46)

***

### rootAabb

> **rootAabb**: `ComputedRef`\<`Aabb2D`\>

Defined in: [packages/mce/src/mixins/2.box.ts:17](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/2.box.ts#L17)

***

### saveAsConfig()

> **saveAsConfig**: (`filename?`) => `void`

Defined in: [packages/mce/src/mixins/0.config.ts:17](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/0.config.ts#L17)

#### Parameters

##### filename?

`string`

#### Returns

`void`

***

### screenCenter

> **screenCenter**: `ComputedRef`\<\{ `x`: `number`; `y`: `number`; \}\>

Defined in: [packages/mce/src/mixins/1.screen.ts:10](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/1.screen.ts#L10)

***

### screenCenterOffset

> **screenCenterOffset**: `ComputedRef`\<`Required`\<[`ScreenOffset`](ScreenOffset.md)\>\>

Defined in: [packages/mce/src/mixins/1.screen.ts:9](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/1.screen.ts#L9)

***

### screenControlsOffset

> **screenControlsOffset**: `ComputedRef`\<`Required`\<[`ScreenOffset`](ScreenOffset.md)\>\>

Defined in: [packages/mce/src/mixins/1.screen.ts:8](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/1.screen.ts#L8)

***

### selection

> **selection**: `Ref`\<`Node`[]\>

Defined in: [packages/mce/src/mixins/0.context.ts:49](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/0.context.ts#L49)

***

### selectionAabb

> **selectionAabb**: `ComputedRef`\<`Aabb2D`\>

Defined in: [packages/mce/src/mixins/2.box.ts:18](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/2.box.ts#L18)

***

### selectionAabbInDrawboard

> **selectionAabbInDrawboard**: `ComputedRef`\<`Aabb2D`\>

Defined in: [packages/mce/src/mixins/2.box.ts:19](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/2.box.ts#L19)

***

### selectionMarquee

> **selectionMarquee**: `Ref`\<`Aabb2D`\>

Defined in: [packages/mce/src/mixins/0.context.ts:50](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/0.context.ts#L50)

***

### selectionObb

> **selectionObb**: `ComputedRef`\<`Obb2D`\>

Defined in: [packages/mce/src/mixins/2.box.ts:20](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/2.box.ts#L20)

***

### selectionObbInDrawboard

> **selectionObbInDrawboard**: `ComputedRef`\<`Aabb2D`\>

Defined in: [packages/mce/src/mixins/2.box.ts:21](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/2.box.ts#L21)

***

### setActiveDrawingTool()

> **setActiveDrawingTool**: (`tool`) => `void`

Defined in: [packages/mce/src/mixins/drawingTool.ts:27](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/drawingTool.ts#L27)

#### Parameters

##### tool

`string` | `undefined`

#### Returns

`void`

***

### setConfigValue()

> **setConfigValue**: (`path`, `value`) => `void`

Defined in: [packages/mce/src/mixins/0.config.ts:12](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/0.config.ts#L12)

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

Defined in: [packages/mce/src/mixins/0.context.ts:39](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/0.context.ts#L39)

#### Parameters

##### mode

`string` | `undefined`

#### Returns

`void`

***

### setDefaultFont()

> **setDefaultFont**: (`source`, `options?`) => `Promise`\<`void`\>

Defined in: [packages/mce/src/mixins/0.font.ts:9](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/0.font.ts#L9)

#### Parameters

##### source

`FontSource`

##### options?

`FontLoadOptions`

#### Returns

`Promise`\<`void`\>

***

### setDoc()

> **setDoc**: (`doc`) => `Promise`\<`Doc`\>

Defined in: [packages/mce/src/mixins/4.4.doc.ts:23](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/4.4.doc.ts#L23)

#### Parameters

##### doc

[`DocumentSource`](../type-aliases/DocumentSource.md)

#### Returns

`Promise`\<`Doc`\>

***

### setLock()

> **setLock**: (`node`, `lock`) => `void`

Defined in: [packages/mce/src/mixins/0.context.ts:66](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/0.context.ts#L66)

#### Parameters

##### node

`Node`

##### lock

`boolean`

#### Returns

`void`

***

### setTextContentByEachFragment()

> **setTextContentByEachFragment**: (`handler`) => `void`

Defined in: [packages/mce/src/mixins/4.1.text.ts:23](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/4.1.text.ts#L23)

#### Parameters

##### handler

(`fragment`) => `void`

#### Returns

`void`

***

### setTextFill()

> **setTextFill**: (`value`) => `void`

Defined in: [packages/mce/src/mixins/4.1.text.ts:22](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/4.1.text.ts#L22)

#### Parameters

##### value

`NormalizedFill` | `undefined`

#### Returns

`void`

***

### setTextStyle()

> **setTextStyle**: (`key`, `value`) => `void`

Defined in: [packages/mce/src/mixins/4.1.text.ts:20](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/4.1.text.ts#L20)

#### Parameters

##### key

`string`

##### value

`any`

#### Returns

`void`

***

### setVisible()

> **setVisible**: (`node`, `visible`) => `void`

Defined in: [packages/mce/src/mixins/0.context.ts:64](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/0.context.ts#L64)

#### Parameters

##### node

`Node`

##### visible

`boolean`

#### Returns

`void`

***

### snapshot()

> **snapshot**: () => `void`

Defined in: [packages/mce/src/mixins/snapshot.ts:15](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/snapshot.ts#L15)

#### Returns

`void`

***

### snapThreshold

> **snapThreshold**: `ComputedRef`\<`number`\>

Defined in: [packages/mce/src/plugins/smartGuides.ts:12](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/plugins/smartGuides.ts#L12)

***

### startTime

> **startTime**: `WritableComputedRef`\<`number`\>

Defined in: [packages/mce/src/mixins/1.timeline.ts:12](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/1.timeline.ts#L12)

***

### state

> **state**: `Ref`\<[`State`](../type-aliases/State.md)\>

Defined in: [packages/mce/src/mixins/0.context.ts:54](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/0.context.ts#L54)

***

### t

> **t**: [`Translation`](../type-aliases/Translation.md)

Defined in: [packages/mce/src/mixins/0.locale.ts:12](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/0.locale.ts#L12)

***

### textFontSizeToFit()

> **textFontSizeToFit**: (`element`, `scale?`) => `void`

Defined in: [packages/mce/src/mixins/4.1.text.ts:17](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/4.1.text.ts#L17)

#### Parameters

##### element

`Element2D`

##### scale?

`number`

#### Returns

`void`

***

### textSelection

> **textSelection**: `Ref`\<`IndexCharacter`[] \| `undefined`\>

Defined in: [packages/mce/src/mixins/0.context.ts:52](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/0.context.ts#L52)

***

### textToFit()

> **textToFit**: (`element`, `typography?`) => `void`

Defined in: [packages/mce/src/mixins/4.1.text.ts:18](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/4.1.text.ts#L18)

#### Parameters

##### element

`Element2D`

##### typography?

[`TypographyStrategy`](../type-aliases/TypographyStrategy.md)

#### Returns

`void`

***

### timeline

> **timeline**: `Ref`\<`Timeline`\>

Defined in: [packages/mce/src/mixins/0.context.ts:36](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/0.context.ts#L36)

***

### to()

> **to**: \<`K`\>(`name`, `options?`) => [`Exporters`](Exporters.md)\[`K`\]

Defined in: [packages/mce/src/mixins/2.export.ts:30](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/2.export.ts#L30)

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

### undo()

> **undo**: () => `void`

Defined in: [packages/mce/src/plugins/history.ts:10](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/plugins/history.ts#L10)

#### Returns

`void`

***

### unregisterCommand()

> **unregisterCommand**: (`command`) => `void`

Defined in: [packages/mce/src/mixins/0.command.ts:25](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/0.command.ts#L25)

#### Parameters

##### command

`string`

#### Returns

`void`

***

### unregisterDrawingTool()

> **unregisterDrawingTool**: (`tool`) => `void`

Defined in: [packages/mce/src/mixins/drawingTool.ts:26](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/drawingTool.ts#L26)

#### Parameters

##### tool

`string`

#### Returns

`void`

***

### unregisterExporter()

> **unregisterExporter**: (`name`) => `void`

Defined in: [packages/mce/src/mixins/2.export.ts:28](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/2.export.ts#L28)

#### Parameters

##### name

`string`

#### Returns

`void`

***

### unregisterHotkey()

> **unregisterHotkey**: (`command`) => `void`

Defined in: [packages/mce/src/mixins/1.hotkey.ts:43](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/1.hotkey.ts#L43)

#### Parameters

##### command

`string`

#### Returns

`void`

***

### unregisterLoader()

> **unregisterLoader**: (`name`) => `void`

Defined in: [packages/mce/src/mixins/2.load.ts:19](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/2.load.ts#L19)

#### Parameters

##### name

`string`

#### Returns

`void`

***

### upload

> **upload**: [`Upload`](../type-aliases/Upload.md)

Defined in: [packages/mce/src/mixins/1.upload.ts:8](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/1.upload.ts#L8)

***

### viewportAabb

> **viewportAabb**: `ComputedRef`\<`Aabb2D`\>

Defined in: [packages/mce/src/mixins/2.box.ts:16](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/2.box.ts#L16)

***

### waitUntilFontLoad()

> **waitUntilFontLoad**: () => `Promise`\<`void`\>

Defined in: [packages/mce/src/mixins/0.font.ts:10](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/0.font.ts#L10)

#### Returns

`Promise`\<`void`\>

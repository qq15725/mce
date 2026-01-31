[**mce**](../../../../README.md)

***

[mce](../../../../README.md) / [Mce](../README.md) / Commands

# Interface: Commands

Defined in: [packages/mce/src/plugins/arrange.ts:25](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/plugins/arrange.ts#L25)

## Properties

### addSubNode()

> **addSubNode**: () => `void`

Defined in: [packages/mce/src/plugins/node.ts:7](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/plugins/node.ts#L7)

#### Returns

`void`

***

### addTextElement()

> **addTextElement**: (`options?`) => `Element2D`

Defined in: [packages/mce/src/plugins/text.ts:14](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/plugins/text.ts#L14)

#### Parameters

##### options?

[`addTextElementOptions`](addTextElementOptions.md)

#### Returns

`Element2D`

***

### align()

> **align**: (`direction`) => `void`

Defined in: [packages/mce/src/plugins/arrange.ts:31](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/plugins/arrange.ts#L31)

#### Parameters

##### direction

[`AlignDirection`](../type-aliases/AlignDirection.md)

#### Returns

`void`

***

### alignBottom()

> **alignBottom**: () => `void`

Defined in: [packages/mce/src/plugins/arrange.ts:35](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/plugins/arrange.ts#L35)

#### Returns

`void`

***

### alignHorizontalCenter()

> **alignHorizontalCenter**: () => `void`

Defined in: [packages/mce/src/plugins/arrange.ts:36](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/plugins/arrange.ts#L36)

#### Returns

`void`

***

### alignLeft()

> **alignLeft**: () => `void`

Defined in: [packages/mce/src/plugins/arrange.ts:32](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/plugins/arrange.ts#L32)

#### Returns

`void`

***

### alignRight()

> **alignRight**: () => `void`

Defined in: [packages/mce/src/plugins/arrange.ts:33](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/plugins/arrange.ts#L33)

#### Returns

`void`

***

### alignTop()

> **alignTop**: () => `void`

Defined in: [packages/mce/src/plugins/arrange.ts:34](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/plugins/arrange.ts#L34)

#### Returns

`void`

***

### alignVerticalCenter()

> **alignVerticalCenter**: () => `void`

Defined in: [packages/mce/src/plugins/arrange.ts:37](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/plugins/arrange.ts#L37)

#### Returns

`void`

***

### applyFormatPaint()

> **applyFormatPaint**: (`targets?`) => `void`

Defined in: [packages/mce/src/plugins/formatPaint.ts:9](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/plugins/formatPaint.ts#L9)

#### Parameters

##### targets?

`Element2D`[]

#### Returns

`void`

***

### bringForward()

> **bringForward**: (`target?`) => `void`

Defined in: [packages/mce/src/plugins/arrange.ts:27](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/plugins/arrange.ts#L27)

#### Parameters

##### target?

`Node`

#### Returns

`void`

***

### bringToFront()

> **bringToFront**: (`target?`) => `void`

Defined in: [packages/mce/src/plugins/arrange.ts:29](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/plugins/arrange.ts#L29)

#### Parameters

##### target?

`Node` | `Node`[]

#### Returns

`void`

***

### cancel()

> **cancel**: () => `void`

Defined in: [packages/mce/src/plugins/edit.ts:16](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/plugins/edit.ts#L16)

#### Returns

`void`

***

### copy()

> **copy**: (`source?`) => `Promise`\<`void`\>

Defined in: [packages/mce/src/plugins/edit.ts:18](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/plugins/edit.ts#L18)

#### Parameters

##### source?

[`CopySource`](../type-aliases/CopySource.md)

#### Returns

`Promise`\<`void`\>

***

### copyAs()

> **copyAs**: (`type`, `options?`) => `Promise`\<`void`\>

Defined in: [packages/mce/src/plugins/copyAs.ts:10](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/plugins/copyAs.ts#L10)

#### Parameters

##### type

keyof [`Exporters`](Exporters.md)

##### options?

[`CopyAsOptions`](CopyAsOptions.md)

#### Returns

`Promise`\<`void`\>

***

### cut()

> **cut**: () => `Promise`\<`void`\>

Defined in: [packages/mce/src/plugins/edit.ts:19](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/plugins/edit.ts#L19)

#### Returns

`Promise`\<`void`\>

***

### delete()

> **delete**: () => `void`

Defined in: [packages/mce/src/plugins/edit.ts:17](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/plugins/edit.ts#L17)

#### Returns

`void`

***

### distributeHorizontalSpacing()

> **distributeHorizontalSpacing**: () => `void`

Defined in: [packages/mce/src/plugins/arrange.ts:39](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/plugins/arrange.ts#L39)

#### Returns

`void`

***

### distributeSpacing()

> **distributeSpacing**: (`direction`) => `void`

Defined in: [packages/mce/src/plugins/arrange.ts:38](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/plugins/arrange.ts#L38)

#### Parameters

##### direction

[`DistributeSpacingDirection`](../type-aliases/DistributeSpacingDirection.md)

#### Returns

`void`

***

### distributeVerticalSpacing()

> **distributeVerticalSpacing**: () => `void`

Defined in: [packages/mce/src/plugins/arrange.ts:40](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/plugins/arrange.ts#L40)

#### Returns

`void`

***

### duplicate()

> **duplicate**: () => `void`

Defined in: [packages/mce/src/plugins/edit.ts:21](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/plugins/edit.ts#L21)

#### Returns

`void`

***

### enter()

> **enter**: () => `void`

Defined in: [packages/mce/src/plugins/transform.ts:10](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/plugins/transform.ts#L10)

#### Returns

`void`

***

### exitFormatPaint()

> **exitFormatPaint**: () => `void`

Defined in: [packages/mce/src/plugins/formatPaint.ts:10](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/plugins/formatPaint.ts#L10)

#### Returns

`void`

***

### flip()

> **flip**: (`target`) => `void`

Defined in: [packages/mce/src/plugins/transform.ts:11](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/plugins/transform.ts#L11)

#### Parameters

##### target

[`FlipTarget`](../type-aliases/FlipTarget.md)

#### Returns

`void`

***

### flipHorizontal()

> **flipHorizontal**: () => `void`

Defined in: [packages/mce/src/plugins/transform.ts:12](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/plugins/transform.ts#L12)

#### Returns

`void`

***

### flipVertical()

> **flipVertical**: () => `void`

Defined in: [packages/mce/src/plugins/transform.ts:13](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/plugins/transform.ts#L13)

#### Returns

`void`

***

### formatPaint()

> **formatPaint**: () => `void`

Defined in: [packages/mce/src/plugins/formatPaint.ts:8](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/plugins/formatPaint.ts#L8)

#### Returns

`void`

***

### frameSelection()

> **frameSelection**: () => `void`

Defined in: [packages/mce/src/plugins/selection.ts:31](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/plugins/selection.ts#L31)

#### Returns

`void`

***

### groupSelection()

> **groupSelection**: () => `void`

Defined in: [packages/mce/src/plugins/selection.ts:29](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/plugins/selection.ts#L29)

#### Returns

`void`

***

### import()

> **import**: (`options?`) => `Promise`\<`Element2D`[]\>

Defined in: [packages/mce/src/plugins/import.ts:13](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/plugins/import.ts#L13)

#### Parameters

##### options?

[`ImportOptions`](ImportOptions.md)

#### Returns

`Promise`\<`Element2D`[]\>

***

### insertImage()

> **insertImage**: (`url`, `options?`) => `Promise`\<`Element2D`\>

Defined in: [packages/mce/src/plugins/image.ts:13](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/plugins/image.ts#L13)

#### Parameters

##### url

`string`

##### options?

[`InsertImageOptions`](InsertImageOptions.md)

#### Returns

`Promise`\<`Element2D`\>

***

### layerScrollIntoView()

> **layerScrollIntoView**: () => `boolean`

Defined in: [packages/mce/src/plugins/ui.ts:18](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/plugins/ui.ts#L18)

#### Returns

`boolean`

***

### lockOrUnlockSelection()

> **lockOrUnlockSelection**: (`target?`) => `void`

Defined in: [packages/mce/src/plugins/selection.ts:33](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/plugins/selection.ts#L33)

#### Parameters

##### target?

`"lock"` | `"unlock"`

#### Returns

`void`

***

### marqueeSelect()

> **marqueeSelect**: (`marquee?`) => `void`

Defined in: [packages/mce/src/plugins/selection.ts:21](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/plugins/selection.ts#L21)

#### Parameters

##### marquee?

`Aabb2D`

#### Returns

`void`

***

### move()

> **move**: (`direction`, `distance?`) => `void`

Defined in: [packages/mce/src/plugins/move.ts:8](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/plugins/move.ts#L8)

#### Parameters

##### direction

[`MoveCommandDirection`](../type-aliases/MoveCommandDirection.md)

##### distance?

`number`

#### Returns

`void`

***

### moveBottom()

> **moveBottom**: (`distance?`) => `void`

Defined in: [packages/mce/src/plugins/move.ts:12](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/plugins/move.ts#L12)

#### Parameters

##### distance?

`number`

#### Returns

`void`

***

### moveLeft()

> **moveLeft**: (`distance?`) => `void`

Defined in: [packages/mce/src/plugins/move.ts:9](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/plugins/move.ts#L9)

#### Parameters

##### distance?

`number`

#### Returns

`void`

***

### moveRight()

> **moveRight**: (`distance?`) => `void`

Defined in: [packages/mce/src/plugins/move.ts:11](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/plugins/move.ts#L11)

#### Parameters

##### distance?

`number`

#### Returns

`void`

***

### moveTop()

> **moveTop**: (`distance?`) => `void`

Defined in: [packages/mce/src/plugins/move.ts:10](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/plugins/move.ts#L10)

#### Parameters

##### distance?

`number`

#### Returns

`void`

***

### nestIntoFrame()

> **nestIntoFrame**: (`element`, `options?`) => `void`

Defined in: [packages/mce/src/plugins/autoNest.ts:14](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/plugins/autoNest.ts#L14)

#### Parameters

##### element

`Element2D`

##### options?

[`NestIntoFrameOptions`](NestIntoFrameOptions.md)

#### Returns

`void`

***

### new()

> **new**: () => `void`

Defined in: [packages/mce/src/plugins/new.ts:6](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/plugins/new.ts#L6)

#### Returns

`void`

***

### open()

> **open**: () => `Promise`\<`void`\>

Defined in: [packages/mce/src/plugins/open.ts:6](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/plugins/open.ts#L6)

#### Returns

`Promise`\<`void`\>

***

### openContextMenu()

> **openContextMenu**: (`e?`) => `boolean`

Defined in: [packages/mce/src/plugins/ui.ts:17](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/plugins/ui.ts#L17)

#### Parameters

##### e?

`MouseEvent` | `PointerEvent`

#### Returns

`boolean`

***

### panels()

> **panels**: \<`T`\>(`panel`, ...`args`) => `Promise`\<`boolean`\>

Defined in: [packages/mce/src/plugins/panels.ts:14](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/plugins/panels.ts#L14)

#### Type Parameters

##### T

`T` *extends* keyof [`Panels`](Panels.md)

#### Parameters

##### panel

`T`

##### args

...[`Panels`](Panels.md)\[`T`\]

#### Returns

`Promise`\<`boolean`\>

***

### paste()

> **paste**: (`source?`) => `Promise`\<`void`\>

Defined in: [packages/mce/src/plugins/edit.ts:20](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/plugins/edit.ts#L20)

#### Parameters

##### source?

[`PasteSource`](../type-aliases/PasteSource.md)

#### Returns

`Promise`\<`void`\>

***

### pointerDown()

> **pointerDown**: (`e`, `options?`) => `void`

Defined in: [packages/mce/src/plugins/ui.ts:14](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/plugins/ui.ts#L14)

#### Parameters

##### e

`PointerInputEvent`

##### options?

[`PointerDownOptions`](PointerDownOptions.md)

#### Returns

`void`

***

### redo()

> **redo**: () => `void`

Defined in: [packages/mce/src/plugins/history.ts:21](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/plugins/history.ts#L21)

#### Returns

`void`

***

### rotate()

> **rotate**: (`deg`) => `void`

Defined in: [packages/mce/src/plugins/rotate.ts:6](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/plugins/rotate.ts#L6)

#### Parameters

##### deg

`number`

#### Returns

`void`

***

### rotate90()

> **rotate90**: () => `void`

Defined in: [packages/mce/src/plugins/rotate.ts:7](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/plugins/rotate.ts#L7)

#### Returns

`void`

***

### saveAs()

> **saveAs**: (`type`, `options?`) => `Promise`\<`void`\>

Defined in: [packages/mce/src/plugins/saveAs.ts:11](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/plugins/saveAs.ts#L11)

#### Parameters

##### type

keyof [`Exporters`](Exporters.md)

##### options?

[`SaveAsOptions`](SaveAsOptions.md)

#### Returns

`Promise`\<`void`\>

***

### scrollTo()

> **scrollTo**: (`target`, `options?`) => `Promise`\<`void`\>

Defined in: [packages/mce/src/plugins/scroll.ts:22](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/plugins/scroll.ts#L22)

#### Parameters

##### target

[`ScrollTarget`](../type-aliases/ScrollTarget.md)

##### options?

[`ScrollToOptions`](ScrollToOptions.md)

#### Returns

`Promise`\<`void`\>

***

### scrollToSelection()

> **scrollToSelection**: (`options?`) => `void`

Defined in: [packages/mce/src/plugins/scroll.ts:23](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/plugins/scroll.ts#L23)

#### Parameters

##### options?

[`ScrollToOptions`](ScrollToOptions.md)

#### Returns

`void`

***

### select()

> **select**: (`target`) => `void`

Defined in: [packages/mce/src/plugins/selection.ts:20](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/plugins/selection.ts#L20)

#### Parameters

##### target

[`SelectTarget`](../type-aliases/SelectTarget.md)

#### Returns

`void`

***

### selectAll()

> **selectAll**: () => `void`

Defined in: [packages/mce/src/plugins/selection.ts:22](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/plugins/selection.ts#L22)

#### Returns

`void`

***

### selectChildren()

> **selectChildren**: () => `void`

Defined in: [packages/mce/src/plugins/selection.ts:25](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/plugins/selection.ts#L25)

#### Returns

`void`

***

### selectInverse()

> **selectInverse**: () => `void`

Defined in: [packages/mce/src/plugins/selection.ts:23](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/plugins/selection.ts#L23)

#### Returns

`void`

***

### selectNextSibling()

> **selectNextSibling**: () => `void`

Defined in: [packages/mce/src/plugins/selection.ts:28](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/plugins/selection.ts#L28)

#### Returns

`void`

***

### selectNone()

> **selectNone**: () => `void`

Defined in: [packages/mce/src/plugins/selection.ts:24](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/plugins/selection.ts#L24)

#### Returns

`void`

***

### selectParent()

> **selectParent**: () => `void`

Defined in: [packages/mce/src/plugins/selection.ts:26](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/plugins/selection.ts#L26)

#### Returns

`void`

***

### selectPreviousSibling()

> **selectPreviousSibling**: () => `void`

Defined in: [packages/mce/src/plugins/selection.ts:27](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/plugins/selection.ts#L27)

#### Returns

`void`

***

### sendBackward()

> **sendBackward**: (`target?`) => `void`

Defined in: [packages/mce/src/plugins/arrange.ts:28](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/plugins/arrange.ts#L28)

#### Parameters

##### target?

`Node`

#### Returns

`void`

***

### sendToBack()

> **sendToBack**: (`target?`) => `void`

Defined in: [packages/mce/src/plugins/arrange.ts:30](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/plugins/arrange.ts#L30)

#### Parameters

##### target?

`Node` | `Node`[]

#### Returns

`void`

***

### setActiveDrawingTool()

> **setActiveDrawingTool**: (`tool`) => `void`

Defined in: [packages/mce/src/plugins/drawingTool.ts:7](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/plugins/drawingTool.ts#L7)

#### Parameters

##### tool

`string` | `undefined`

#### Returns

`void`

***

### setSmartSelectionCurrentElement()

> **setSmartSelectionCurrentElement**: (`element?`) => `void`

Defined in: [packages/mce/src/plugins/smartSelection.ts:9](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/plugins/smartSelection.ts#L9)

#### Parameters

##### element?

`Element2D`

#### Returns

`void`

***

### setState()

> **setState**: (`val`) => `void`

Defined in: [packages/mce/src/plugins/state.ts:6](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/plugins/state.ts#L6)

#### Parameters

##### val

[`State`](../type-aliases/State.md)

#### Returns

`void`

***

### showOrHideSelection()

> **showOrHideSelection**: (`target?`) => `void`

Defined in: [packages/mce/src/plugins/selection.ts:32](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/plugins/selection.ts#L32)

#### Parameters

##### target?

`"show"` | `"hide"`

#### Returns

`void`

***

### startTransform()

> **startTransform**: (`e?`) => `boolean`

Defined in: [packages/mce/src/plugins/ui.ts:16](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/plugins/ui.ts#L16)

#### Parameters

##### e?

`MouseEvent` | `PointerEvent`

#### Returns

`boolean`

***

### startTyping()

> **startTyping**: (`e?`) => `Promise`\<`boolean`\>

Defined in: [packages/mce/src/plugins/ui.ts:15](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/plugins/ui.ts#L15)

#### Parameters

##### e?

`MouseEvent` | `PointerEvent`

#### Returns

`Promise`\<`boolean`\>

***

### testPerformance()

> **testPerformance**: (`count?`) => `void`

Defined in: [packages/mce/src/plugins/test.ts:7](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/plugins/test.ts#L7)

#### Parameters

##### count?

`number`

#### Returns

`void`

***

### tidyUp()

> **tidyUp**: () => `void`

Defined in: [packages/mce/src/plugins/arrange.ts:41](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/plugins/arrange.ts#L41)

#### Returns

`void`

***

### undo()

> **undo**: () => `void`

Defined in: [packages/mce/src/plugins/history.ts:20](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/plugins/history.ts#L20)

#### Returns

`void`

***

### ungroupSelection()

> **ungroupSelection**: () => `void`

Defined in: [packages/mce/src/plugins/selection.ts:30](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/plugins/selection.ts#L30)

#### Returns

`void`

***

### view()

> **view**: \<`T`\>(`view`, ...`args`) => `Promise`\<`boolean`\>

Defined in: [packages/mce/src/plugins/view.ts:17](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/plugins/view.ts#L17)

#### Type Parameters

##### T

`T` *extends* keyof [`Views`](Views.md)

#### Parameters

##### view

`T`

##### args

...[`Views`](Views.md)\[`T`\]

#### Returns

`Promise`\<`boolean`\>

***

### zoomIn()

> **zoomIn**: () => `void`

Defined in: [packages/mce/src/plugins/zoom.ts:33](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/plugins/zoom.ts#L33)

#### Returns

`void`

***

### zoomOut()

> **zoomOut**: () => `void`

Defined in: [packages/mce/src/plugins/zoom.ts:34](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/plugins/zoom.ts#L34)

#### Returns

`void`

***

### zoomTo()

> **zoomTo**: (`target`, `options?`) => `Promise`\<`void`\>

Defined in: [packages/mce/src/plugins/zoom.ts:35](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/plugins/zoom.ts#L35)

#### Parameters

##### target

[`ZoomTarget`](../type-aliases/ZoomTarget.md)

##### options?

[`ZoomToOptions`](ZoomToOptions.md)

#### Returns

`Promise`\<`void`\>

***

### zoomTo100()

> **zoomTo100**: () => `void`

Defined in: [packages/mce/src/plugins/zoom.ts:36](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/plugins/zoom.ts#L36)

#### Returns

`void`

***

### zoomToFit()

> **zoomToFit**: () => `void`

Defined in: [packages/mce/src/plugins/zoom.ts:37](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/plugins/zoom.ts#L37)

#### Returns

`void`

***

### zoomToSelection()

> **zoomToSelection**: (`options?`) => `void`

Defined in: [packages/mce/src/plugins/zoom.ts:38](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/plugins/zoom.ts#L38)

#### Parameters

##### options?

[`ZoomToOptions`](ZoomToOptions.md)

#### Returns

`void`

***

### zOrder()

> **zOrder**: (`type`, `target?`) => `void`

Defined in: [packages/mce/src/plugins/arrange.ts:26](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/plugins/arrange.ts#L26)

#### Parameters

##### type

[`ZOrderType`](../type-aliases/ZOrderType.md)

##### target?

`Node` | `Node`[]

#### Returns

`void`

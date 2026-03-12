[**mce**](../../../../README.md)

***

[mce](../../../../README.md) / [Mce](../README.md) / Commands

# Interface: Commands

Defined in: [packages/mce/src/plugins/arrange.ts:25](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/arrange.ts#L25)

## Properties

### activateTool()

> **activateTool**: (`tool`) => `void`

Defined in: [packages/mce/src/plugins/tool.ts:7](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/tool.ts#L7)

#### Parameters

##### tool

`string` | `undefined`

#### Returns

`void`

***

### addSubNode()

> **addSubNode**: () => `void`

Defined in: [packages/mce/src/plugins/node.ts:16](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/node.ts#L16)

#### Returns

`void`

***

### addTextElement()

> **addTextElement**: (`options?`) => `Element2D`

Defined in: [packages/mce/src/plugins/typography.ts:43](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/typography.ts#L43)

#### Parameters

##### options?

[`addTextElementOptions`](addTextElementOptions.md)

#### Returns

`Element2D`

***

### align()

> **align**: (`direction`) => `void`

Defined in: [packages/mce/src/plugins/arrange.ts:31](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/arrange.ts#L31)

#### Parameters

##### direction

[`AlignDirection`](../type-aliases/AlignDirection.md)

#### Returns

`void`

***

### alignBottom()

> **alignBottom**: () => `void`

Defined in: [packages/mce/src/plugins/arrange.ts:35](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/arrange.ts#L35)

#### Returns

`void`

***

### alignHorizontalCenter()

> **alignHorizontalCenter**: () => `void`

Defined in: [packages/mce/src/plugins/arrange.ts:36](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/arrange.ts#L36)

#### Returns

`void`

***

### alignLeft()

> **alignLeft**: () => `void`

Defined in: [packages/mce/src/plugins/arrange.ts:32](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/arrange.ts#L32)

#### Returns

`void`

***

### alignRight()

> **alignRight**: () => `void`

Defined in: [packages/mce/src/plugins/arrange.ts:33](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/arrange.ts#L33)

#### Returns

`void`

***

### alignTop()

> **alignTop**: () => `void`

Defined in: [packages/mce/src/plugins/arrange.ts:34](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/arrange.ts#L34)

#### Returns

`void`

***

### alignVerticalCenter()

> **alignVerticalCenter**: () => `void`

Defined in: [packages/mce/src/plugins/arrange.ts:37](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/arrange.ts#L37)

#### Returns

`void`

***

### applyFormatPaint()

> **applyFormatPaint**: (`targets?`) => `void`

Defined in: [packages/mce/src/plugins/formatPaint.ts:9](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/formatPaint.ts#L9)

#### Parameters

##### targets?

`Element2D`[]

#### Returns

`void`

***

### bringForward()

> **bringForward**: (`target?`) => `void`

Defined in: [packages/mce/src/plugins/arrange.ts:27](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/arrange.ts#L27)

#### Parameters

##### target?

`Node`

#### Returns

`void`

***

### bringToFront()

> **bringToFront**: (`target?`) => `void`

Defined in: [packages/mce/src/plugins/arrange.ts:29](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/arrange.ts#L29)

#### Parameters

##### target?

`Node` | `Node`[]

#### Returns

`void`

***

### cancel()

> **cancel**: () => `void`

Defined in: [packages/mce/src/plugins/edit.ts:20](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/edit.ts#L20)

#### Returns

`void`

***

### clearDoc()

> **clearDoc**: () => `void`

Defined in: [packages/mce/src/plugins/doc.ts:39](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/doc.ts#L39)

#### Returns

`void`

***

### clearRulerLines()

> **clearRulerLines**: () => `void`

Defined in: [packages/mce/src/plugins/ruler.ts:19](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/ruler.ts#L19)

#### Returns

`void`

***

### copy()

> **copy**: (`source?`) => `Promise`\<`void`\>

Defined in: [packages/mce/src/plugins/edit.ts:22](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/edit.ts#L22)

#### Parameters

##### source?

[`CopySource`](../type-aliases/CopySource.md)

#### Returns

`Promise`\<`void`\>

***

### copyAs()

> **copyAs**: (`type`, `options?`) => `Promise`\<`void`\>

Defined in: [packages/mce/src/plugins/edit.ts:23](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/edit.ts#L23)

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

Defined in: [packages/mce/src/plugins/edit.ts:24](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/edit.ts#L24)

#### Returns

`Promise`\<`void`\>

***

### delete()

> **delete**: () => `void`

Defined in: [packages/mce/src/plugins/edit.ts:21](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/edit.ts#L21)

#### Returns

`void`

***

### distributeHorizontalSpacing()

> **distributeHorizontalSpacing**: () => `void`

Defined in: [packages/mce/src/plugins/arrange.ts:39](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/arrange.ts#L39)

#### Returns

`void`

***

### distributeSpacing()

> **distributeSpacing**: (`direction`) => `void`

Defined in: [packages/mce/src/plugins/arrange.ts:38](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/arrange.ts#L38)

#### Parameters

##### direction

[`DistributeSpacingDirection`](../type-aliases/DistributeSpacingDirection.md)

#### Returns

`void`

***

### distributeVerticalSpacing()

> **distributeVerticalSpacing**: () => `void`

Defined in: [packages/mce/src/plugins/arrange.ts:40](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/arrange.ts#L40)

#### Returns

`void`

***

### duplicate()

> **duplicate**: () => `void`

Defined in: [packages/mce/src/plugins/edit.ts:26](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/edit.ts#L26)

#### Returns

`void`

***

### enter()

> **enter**: () => `void`

Defined in: [packages/mce/src/plugins/transform.ts:52](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/transform.ts#L52)

#### Returns

`void`

***

### exitFormatPaint()

> **exitFormatPaint**: () => `void`

Defined in: [packages/mce/src/plugins/formatPaint.ts:10](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/formatPaint.ts#L10)

#### Returns

`void`

***

### flip()

> **flip**: (`direction`) => `void`

Defined in: [packages/mce/src/plugins/transform.ts:62](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/transform.ts#L62)

#### Parameters

##### direction

[`FlipDirection`](../type-aliases/FlipDirection.md)

#### Returns

`void`

***

### flipHorizontal()

> **flipHorizontal**: () => `void`

Defined in: [packages/mce/src/plugins/transform.ts:63](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/transform.ts#L63)

#### Returns

`void`

***

### flipVertical()

> **flipVertical**: () => `void`

Defined in: [packages/mce/src/plugins/transform.ts:64](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/transform.ts#L64)

#### Returns

`void`

***

### formatPaint()

> **formatPaint**: () => `void`

Defined in: [packages/mce/src/plugins/formatPaint.ts:8](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/formatPaint.ts#L8)

#### Returns

`void`

***

### frameSelection()

> **frameSelection**: () => `void`

Defined in: [packages/mce/src/plugins/selection.ts:32](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/selection.ts#L32)

#### Returns

`void`

***

### getDoc()

> **getDoc**: () => [`JsonData`](JsonData.md)

Defined in: [packages/mce/src/plugins/doc.ts:36](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/doc.ts#L36)

#### Returns

[`JsonData`](JsonData.md)

***

### getState()

> **getState**: () => [`State`](../type-aliases/State.md)

Defined in: [packages/mce/src/plugins/state.ts:6](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/state.ts#L6)

#### Returns

[`State`](../type-aliases/State.md)

***

### getTextFill()

> **getTextFill**: () => `NormalizedFill` \| `undefined`

Defined in: [packages/mce/src/plugins/typography.ts:49](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/typography.ts#L49)

#### Returns

`NormalizedFill` \| `undefined`

***

### getTextStyle()

> **getTextStyle**: (`key`) => `any`

Defined in: [packages/mce/src/plugins/typography.ts:47](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/typography.ts#L47)

#### Parameters

##### key

`string`

#### Returns

`any`

***

### getTransform()

> **getTransform**: () => [`TransformValue`](TransformValue.md)

Defined in: [packages/mce/src/plugins/transform.ts:53](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/transform.ts#L53)

#### Returns

[`TransformValue`](TransformValue.md)

***

### getUiConfig()

> **getUiConfig**: \<`T`\>(`name`) => [`UIConfig`](UIConfig.md)\[`T`\]

Defined in: [packages/mce/src/plugins/view.ts:13](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/view.ts#L13)

#### Type Parameters

##### T

`T` *extends* keyof [`UIConfig`](UIConfig.md)

#### Parameters

##### name

`T`

#### Returns

[`UIConfig`](UIConfig.md)\[`T`\]

***

### groupSelection()

> **groupSelection**: () => `void`

Defined in: [packages/mce/src/plugins/selection.ts:30](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/selection.ts#L30)

#### Returns

`void`

***

### handleTextSelection()

> **handleTextSelection**: (`textSelection`, `cb`) => `void`

Defined in: [packages/mce/src/plugins/typography.ts:44](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/typography.ts#L44)

#### Parameters

##### textSelection

`IndexCharacter`[]

##### cb

(`arg`) => `boolean`

#### Returns

`void`

***

### hidePanel()

> **hidePanel**: (`name`, `visible`) => `void`

Defined in: [packages/mce/src/plugins/view.ts:21](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/view.ts#L21)

#### Parameters

##### name

`string`

##### visible

`boolean` | `"toggle"`

#### Returns

`void`

***

### hideUi()

> **hideUi**: (`name`) => `void`

Defined in: [packages/mce/src/plugins/view.ts:16](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/view.ts#L16)

#### Parameters

##### name

keyof [`UIConfig`](UIConfig.md)

#### Returns

`void`

***

### import()

> **import**: (`options?`) => `Promise`\<`Element2D`[]\>

Defined in: [packages/mce/src/plugins/import.ts:13](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/import.ts#L13)

#### Parameters

##### options?

[`ImportOptions`](ImportOptions.md)

#### Returns

`Promise`\<`Element2D`[]\>

***

### insertImage()

> **insertImage**: (`url`, `options?`) => `Promise`\<`Element2D`\>

Defined in: [packages/mce/src/plugins/image.ts:13](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/image.ts#L13)

#### Parameters

##### url

`string`

##### options?

[`InsertImageOptions`](InsertImageOptions.md)

#### Returns

`Promise`\<`Element2D`\>

***

### isPanelVisible()

> **isPanelVisible**: (`name`) => `boolean`

Defined in: [packages/mce/src/plugins/view.ts:19](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/view.ts#L19)

#### Parameters

##### name

`string`

#### Returns

`boolean`

***

### isUiVisible()

> **isUiVisible**: (`name`) => `boolean`

Defined in: [packages/mce/src/plugins/view.ts:15](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/view.ts#L15)

#### Parameters

##### name

keyof [`UIConfig`](UIConfig.md)

#### Returns

`boolean`

***

### layerScrollIntoView()

> **layerScrollIntoView**: () => `boolean`

Defined in: [packages/mce/src/plugins/layers.ts:7](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/layers.ts#L7)

#### Returns

`boolean`

***

### loadDoc()

> **loadDoc**: (`source`) => `Promise`\<`Doc`\>

Defined in: [packages/mce/src/plugins/doc.ts:38](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/doc.ts#L38)

#### Parameters

##### source

`any`

#### Returns

`Promise`\<`Doc`\>

***

### lockOrUnlockSelection()

> **lockOrUnlockSelection**: (`target?`) => `void`

Defined in: [packages/mce/src/plugins/selection.ts:34](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/selection.ts#L34)

#### Parameters

##### target?

`"lock"` | `"unlock"`

#### Returns

`void`

***

### marqueeSelect()

> **marqueeSelect**: (`marquee?`) => `void`

Defined in: [packages/mce/src/plugins/selection.ts:22](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/selection.ts#L22)

#### Parameters

##### marquee?

`Aabb2D`

#### Returns

`void`

***

### move()

> **move**: (`direction`, `distance?`) => `void`

Defined in: [packages/mce/src/plugins/transform.ts:55](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/transform.ts#L55)

#### Parameters

##### direction

[`MoveDirection`](../type-aliases/MoveDirection.md)

##### distance?

`number`

#### Returns

`void`

***

### moveBottom()

> **moveBottom**: (`distance?`) => `void`

Defined in: [packages/mce/src/plugins/transform.ts:59](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/transform.ts#L59)

#### Parameters

##### distance?

`number`

#### Returns

`void`

***

### moveLeft()

> **moveLeft**: (`distance?`) => `void`

Defined in: [packages/mce/src/plugins/transform.ts:56](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/transform.ts#L56)

#### Parameters

##### distance?

`number`

#### Returns

`void`

***

### moveRight()

> **moveRight**: (`distance?`) => `void`

Defined in: [packages/mce/src/plugins/transform.ts:58](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/transform.ts#L58)

#### Parameters

##### distance?

`number`

#### Returns

`void`

***

### moveTop()

> **moveTop**: (`distance?`) => `void`

Defined in: [packages/mce/src/plugins/transform.ts:57](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/transform.ts#L57)

#### Parameters

##### distance?

`number`

#### Returns

`void`

***

### nestIntoFrame()

> **nestIntoFrame**: (`element`, `options?`) => `void`

Defined in: [packages/mce/src/plugins/autoNest.ts:14](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/autoNest.ts#L14)

#### Parameters

##### element

`Element2D`

##### options?

[`NestIntoFrameOptions`](NestIntoFrameOptions.md)

#### Returns

`void`

***

### newDoc()

> **newDoc**: () => `void`

Defined in: [packages/mce/src/plugins/doc.ts:40](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/doc.ts#L40)

#### Returns

`void`

***

### openContextMenu()

> **openContextMenu**: (`event?`) => `boolean`

Defined in: [packages/mce/src/plugins/menu.ts:23](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/menu.ts#L23)

#### Parameters

##### event?

`MouseEvent`

#### Returns

`boolean`

***

### openDoc()

> **openDoc**: () => `Promise`\<`void`\>

Defined in: [packages/mce/src/plugins/doc.ts:41](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/doc.ts#L41)

#### Returns

`Promise`\<`void`\>

***

### paste()

> **paste**: (`source?`) => `Promise`\<`void`\>

Defined in: [packages/mce/src/plugins/edit.ts:25](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/edit.ts#L25)

#### Parameters

##### source?

[`PasteSource`](../type-aliases/PasteSource.md)

#### Returns

`Promise`\<`void`\>

***

### pointerDown()

> **pointerDown**: (`e`, `options?`) => `void`

Defined in: [packages/mce/src/plugins/view.ts:24](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/view.ts#L24)

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

Defined in: [packages/mce/src/plugins/history.ts:22](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/history.ts#L22)

#### Returns

`void`

***

### rotate()

> **rotate**: (`deg`) => `void`

Defined in: [packages/mce/src/plugins/transform.ts:60](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/transform.ts#L60)

#### Parameters

##### deg

`number`

#### Returns

`void`

***

### rotate90()

> **rotate90**: () => `void`

Defined in: [packages/mce/src/plugins/transform.ts:61](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/transform.ts#L61)

#### Returns

`void`

***

### saveAs()

> **saveAs**: (`type`, `options?`) => `Promise`\<`void`\>

Defined in: [packages/mce/src/plugins/saveAs.ts:11](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/saveAs.ts#L11)

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

Defined in: [packages/mce/src/plugins/scroll.ts:31](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/scroll.ts#L31)

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

Defined in: [packages/mce/src/plugins/scroll.ts:32](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/scroll.ts#L32)

#### Parameters

##### options?

[`ScrollToOptions`](ScrollToOptions.md)

#### Returns

`void`

***

### select()

> **select**: (`target`) => `void`

Defined in: [packages/mce/src/plugins/selection.ts:21](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/selection.ts#L21)

#### Parameters

##### target

[`SelectTarget`](../type-aliases/SelectTarget.md)

#### Returns

`void`

***

### selectAll()

> **selectAll**: () => `void`

Defined in: [packages/mce/src/plugins/selection.ts:23](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/selection.ts#L23)

#### Returns

`void`

***

### selectChildren()

> **selectChildren**: () => `void`

Defined in: [packages/mce/src/plugins/selection.ts:26](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/selection.ts#L26)

#### Returns

`void`

***

### selectInverse()

> **selectInverse**: () => `void`

Defined in: [packages/mce/src/plugins/selection.ts:24](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/selection.ts#L24)

#### Returns

`void`

***

### selectNextSibling()

> **selectNextSibling**: () => `void`

Defined in: [packages/mce/src/plugins/selection.ts:29](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/selection.ts#L29)

#### Returns

`void`

***

### selectNone()

> **selectNone**: () => `void`

Defined in: [packages/mce/src/plugins/selection.ts:25](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/selection.ts#L25)

#### Returns

`void`

***

### selectParent()

> **selectParent**: () => `void`

Defined in: [packages/mce/src/plugins/selection.ts:27](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/selection.ts#L27)

#### Returns

`void`

***

### selectPreviousSibling()

> **selectPreviousSibling**: () => `void`

Defined in: [packages/mce/src/plugins/selection.ts:28](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/selection.ts#L28)

#### Returns

`void`

***

### sendBackward()

> **sendBackward**: (`target?`) => `void`

Defined in: [packages/mce/src/plugins/arrange.ts:28](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/arrange.ts#L28)

#### Parameters

##### target?

`Node`

#### Returns

`void`

***

### sendToBack()

> **sendToBack**: (`target?`) => `void`

Defined in: [packages/mce/src/plugins/arrange.ts:30](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/arrange.ts#L30)

#### Parameters

##### target?

`Node` | `Node`[]

#### Returns

`void`

***

### setDoc()

> **setDoc**: (`doc`) => `Doc`

Defined in: [packages/mce/src/plugins/doc.ts:37](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/doc.ts#L37)

#### Parameters

##### doc

[`DocumentSource`](../type-aliases/DocumentSource.md)

#### Returns

`Doc`

***

### setPanelVisible()

> **setPanelVisible**: (`name`, `visible`) => `void`

Defined in: [packages/mce/src/plugins/view.ts:20](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/view.ts#L20)

#### Parameters

##### name

`string`

##### visible

`boolean` | `"toggle"`

#### Returns

`void`

***

### setSmartSelectionCurrentElement()

> **setSmartSelectionCurrentElement**: (`element?`) => `void`

Defined in: [packages/mce/src/plugins/smartSelection.ts:9](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/smartSelection.ts#L9)

#### Parameters

##### element?

`Element2D`

#### Returns

`void`

***

### setState()

> **setState**: (`value`) => `void`

Defined in: [packages/mce/src/plugins/state.ts:7](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/state.ts#L7)

#### Parameters

##### value

[`State`](../type-aliases/State.md)

#### Returns

`void`

***

### setTextContentByEachFragment()

> **setTextContentByEachFragment**: (`handler`) => `void`

Defined in: [packages/mce/src/plugins/typography.ts:51](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/typography.ts#L51)

#### Parameters

##### handler

(`fragment`) => `void`

#### Returns

`void`

***

### setTextFill()

> **setTextFill**: (`value`) => `void`

Defined in: [packages/mce/src/plugins/typography.ts:50](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/typography.ts#L50)

#### Parameters

##### value

`NormalizedFill` | `undefined`

#### Returns

`void`

***

### setTextStyle()

> **setTextStyle**: (`key`, `value`) => `void`

Defined in: [packages/mce/src/plugins/typography.ts:48](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/typography.ts#L48)

#### Parameters

##### key

`string`

##### value

`any`

#### Returns

`void`

***

### setTransform()

> **setTransform**: (`type`, `value`, `options?`) => `void`

Defined in: [packages/mce/src/plugins/transform.ts:54](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/transform.ts#L54)

#### Parameters

##### type

[`TransformType`](../type-aliases/TransformType.md)

##### value

`Partial`\<[`TransformValue`](TransformValue.md)\>

##### options?

[`TransformOptions`](TransformOptions.md)

#### Returns

`void`

***

### setUiVisible()

> **setUiVisible**: (`name`, `visible`) => `void`

Defined in: [packages/mce/src/plugins/view.ts:14](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/view.ts#L14)

#### Parameters

##### name

keyof [`UIConfig`](UIConfig.md)

##### visible

`boolean` | `"toggle"`

#### Returns

`void`

***

### showOrHideSelection()

> **showOrHideSelection**: (`target?`) => `void`

Defined in: [packages/mce/src/plugins/selection.ts:33](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/selection.ts#L33)

#### Parameters

##### target?

`"show"` | `"hide"`

#### Returns

`void`

***

### showPanel()

> **showPanel**: (`name`, `visible`) => `void`

Defined in: [packages/mce/src/plugins/view.ts:22](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/view.ts#L22)

#### Parameters

##### name

`string`

##### visible

`boolean` | `"toggle"`

#### Returns

`void`

***

### showUi()

> **showUi**: (`name`) => `void`

Defined in: [packages/mce/src/plugins/view.ts:17](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/view.ts#L17)

#### Parameters

##### name

keyof [`UIConfig`](UIConfig.md)

#### Returns

`void`

***

### startTransform()

> **startTransform**: (`event?`) => `boolean`

Defined in: [packages/mce/src/plugins/selection.ts:20](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/selection.ts#L20)

#### Parameters

##### event?

`MouseEvent`

#### Returns

`boolean`

***

### startTyping()

> **startTyping**: (`event?`) => `Promise`\<`boolean`\>

Defined in: [packages/mce/src/plugins/typography.ts:42](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/typography.ts#L42)

#### Parameters

##### event?

`MouseEvent`

#### Returns

`Promise`\<`boolean`\>

***

### testPerformance()

> **testPerformance**: (`count?`) => `void`

Defined in: [packages/mce/src/plugins/test.ts:7](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/test.ts#L7)

#### Parameters

##### count?

`number`

#### Returns

`void`

***

### textFontSizeToFit()

> **textFontSizeToFit**: (`element`, `scale?`) => `void`

Defined in: [packages/mce/src/plugins/typography.ts:45](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/typography.ts#L45)

#### Parameters

##### element

`Element2D`

##### scale?

`number`

#### Returns

`void`

***

### textToFit()

> **textToFit**: (`element`, `typography?`) => `void`

Defined in: [packages/mce/src/plugins/typography.ts:46](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/typography.ts#L46)

#### Parameters

##### element

`Element2D`

##### typography?

[`TypographyStrategy`](../type-aliases/TypographyStrategy.md)

#### Returns

`void`

***

### tidyUp()

> **tidyUp**: () => `void`

Defined in: [packages/mce/src/plugins/arrange.ts:41](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/arrange.ts#L41)

#### Returns

`void`

***

### togglePanel()

> **togglePanel**: (`name`, `visible`) => `void`

Defined in: [packages/mce/src/plugins/view.ts:23](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/view.ts#L23)

#### Parameters

##### name

`string`

##### visible

`boolean` | `"toggle"`

#### Returns

`void`

***

### toggleUi()

> **toggleUi**: (`name`) => `void`

Defined in: [packages/mce/src/plugins/view.ts:18](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/view.ts#L18)

#### Parameters

##### name

keyof [`UIConfig`](UIConfig.md)

#### Returns

`void`

***

### undo()

> **undo**: () => `void`

Defined in: [packages/mce/src/plugins/history.ts:21](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/history.ts#L21)

#### Returns

`void`

***

### ungroupSelection()

> **ungroupSelection**: () => `void`

Defined in: [packages/mce/src/plugins/selection.ts:31](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/selection.ts#L31)

#### Returns

`void`

***

### zoomIn()

> **zoomIn**: () => `void`

Defined in: [packages/mce/src/plugins/zoom.ts:37](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/zoom.ts#L37)

#### Returns

`void`

***

### zoomOut()

> **zoomOut**: () => `void`

Defined in: [packages/mce/src/plugins/zoom.ts:38](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/zoom.ts#L38)

#### Returns

`void`

***

### zoomTo()

> **zoomTo**: (`target`, `options?`) => `Promise`\<`void`\>

Defined in: [packages/mce/src/plugins/zoom.ts:39](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/zoom.ts#L39)

#### Parameters

##### target

[`ZoomToTarget`](../type-aliases/ZoomToTarget.md)

##### options?

[`ZoomToOptions`](ZoomToOptions.md)

#### Returns

`Promise`\<`void`\>

***

### zoomTo100()

> **zoomTo100**: () => `void`

Defined in: [packages/mce/src/plugins/zoom.ts:40](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/zoom.ts#L40)

#### Returns

`void`

***

### zoomToFit()

> **zoomToFit**: () => `void`

Defined in: [packages/mce/src/plugins/zoom.ts:41](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/zoom.ts#L41)

#### Returns

`void`

***

### zoomToSelection()

> **zoomToSelection**: (`options?`) => `void`

Defined in: [packages/mce/src/plugins/zoom.ts:42](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/zoom.ts#L42)

#### Parameters

##### options?

[`ZoomToOptions`](ZoomToOptions.md)

#### Returns

`void`

***

### zOrder()

> **zOrder**: (`type`, `target?`) => `void`

Defined in: [packages/mce/src/plugins/arrange.ts:26](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/arrange.ts#L26)

#### Parameters

##### type

[`ZOrderType`](../type-aliases/ZOrderType.md)

##### target?

`Node` | `Node`[]

#### Returns

`void`

[**mce**](../../../../README.md)

***

[mce](../../../../README.md) / [Mce](../README.md) / Options

# Interface: Options

Defined in: [packages/mce/src/mixins/0.config/base.ts:7](https://github.com/qq15725/mce/blob/865b01d697eb28080c375f733b243ebfb2a27a39/packages/mce/src/mixins/0.config/base.ts#L7)

## Extends

- `Partial`\<[`Config`](Config.md)\>

## Properties

### camera?

> `optional` **camera**: `boolean`

Defined in: [packages/mce/src/mixins/0.config/base.ts:35](https://github.com/qq15725/mce/blob/865b01d697eb28080c375f733b243ebfb2a27a39/packages/mce/src/mixins/0.config/base.ts#L35)

#### Inherited from

[`Config`](Config.md).[`camera`](Config.md#camera)

***

### checkerboard?

> `optional` **checkerboard**: `boolean`

Defined in: [packages/mce/src/mixins/0.config/base.ts:31](https://github.com/qq15725/mce/blob/865b01d697eb28080c375f733b243ebfb2a27a39/packages/mce/src/mixins/0.config/base.ts#L31)

#### Inherited from

[`Config`](Config.md).[`checkerboard`](Config.md#checkerboard)

***

### checkerboardStyle?

> `optional` **checkerboardStyle**: `CheckerboardStyle`

Defined in: [packages/mce/src/mixins/0.config/base.ts:32](https://github.com/qq15725/mce/blob/865b01d697eb28080c375f733b243ebfb2a27a39/packages/mce/src/mixins/0.config/base.ts#L32)

#### Inherited from

[`Config`](Config.md).[`checkerboardStyle`](Config.md#checkerboardstyle)

***

### clipboard?

> `optional` **clipboard**: `boolean`

Defined in: [packages/mce/src/plugins/edit.ts:38](https://github.com/qq15725/mce/blob/865b01d697eb28080c375f733b243ebfb2a27a39/packages/mce/src/plugins/edit.ts#L38)

***

### customContextMenu()?

> `optional` **customContextMenu**: (`defaultMenu`, `editor`) => [`MenuItem`](MenuItem.md)[]

Defined in: [packages/mce/src/plugins/menu.ts:23](https://github.com/qq15725/mce/blob/865b01d697eb28080c375f733b243ebfb2a27a39/packages/mce/src/plugins/menu.ts#L23)

#### Parameters

##### defaultMenu

[`MenuItem`](MenuItem.md)[]

##### editor

[`Editor`](Editor.md)

#### Returns

[`MenuItem`](MenuItem.md)[]

***

### customUpload?

> `optional` **customUpload**: [`Upload`](../type-aliases/Upload.md)

Defined in: [packages/mce/src/mixins/1.upload.ts:12](https://github.com/qq15725/mce/blob/865b01d697eb28080c375f733b243ebfb2a27a39/packages/mce/src/mixins/1.upload.ts#L12)

***

### defaultFont?

> `optional` **defaultFont**: `FontSource`

Defined in: [packages/mce/src/mixins/0.font.ts:14](https://github.com/qq15725/mce/blob/865b01d697eb28080c375f733b243ebfb2a27a39/packages/mce/src/mixins/0.font.ts#L14)

***

### doc?

> `optional` **doc**: [`DocumentSource`](../type-aliases/DocumentSource.md)

Defined in: [packages/mce/src/plugins/doc.ts:8](https://github.com/qq15725/mce/blob/865b01d697eb28080c375f733b243ebfb2a27a39/packages/mce/src/plugins/doc.ts#L8)

***

### frameGap?

> `optional` **frameGap**: `number`

Defined in: [packages/mce/src/mixins/0.config/base.ts:37](https://github.com/qq15725/mce/blob/865b01d697eb28080c375f733b243ebfb2a27a39/packages/mce/src/mixins/0.config/base.ts#L37)

#### Inherited from

[`Config`](Config.md).[`frameGap`](Config.md#framegap)

***

### frameOutline?

> `optional` **frameOutline**: `boolean`

Defined in: [packages/mce/src/mixins/0.config/base.ts:36](https://github.com/qq15725/mce/blob/865b01d697eb28080c375f733b243ebfb2a27a39/packages/mce/src/mixins/0.config/base.ts#L36)

#### Inherited from

[`Config`](Config.md).[`frameOutline`](Config.md#frameoutline)

***

### frameScreenshot?

> `optional` **frameScreenshot**: `boolean`

Defined in: [packages/mce/src/mixins/snapshot.ts:11](https://github.com/qq15725/mce/blob/865b01d697eb28080c375f733b243ebfb2a27a39/packages/mce/src/mixins/snapshot.ts#L11)

#### Inherited from

[`Config`](Config.md).[`frameScreenshot`](Config.md#framescreenshot)

***

### gifWorkerUrl?

> `optional` **gifWorkerUrl**: `string`

Defined in: [packages/mce/src/plugins/gif.ts:7](https://github.com/qq15725/mce/blob/865b01d697eb28080c375f733b243ebfb2a27a39/packages/mce/src/plugins/gif.ts#L7)

***

### hotkeys?

> `optional` **hotkeys**: [`HotkeyData`](HotkeyData.md)[]

Defined in: [packages/mce/src/mixins/1.hotkey.ts:22](https://github.com/qq15725/mce/blob/865b01d697eb28080c375f733b243ebfb2a27a39/packages/mce/src/mixins/1.hotkey.ts#L22)

#### Inherited from

[`Config`](Config.md).[`hotkeys`](Config.md#hotkeys)

***

### http?

> `optional` **http**: [`Http`](Http.md)

Defined in: [packages/mce/src/mixins/http.ts:38](https://github.com/qq15725/mce/blob/865b01d697eb28080c375f733b243ebfb2a27a39/packages/mce/src/mixins/http.ts#L38)

***

### layers?

> `optional` **layers**: `boolean`

#### Inherited from

`Options`.[`layers`](#layers)

***

### localDb?

> `optional` **localDb**: `boolean`

Defined in: [packages/mce/src/mixins/0.config/base.ts:40](https://github.com/qq15725/mce/blob/865b01d697eb28080c375f733b243ebfb2a27a39/packages/mce/src/mixins/0.config/base.ts#L40)

#### Inherited from

[`Config`](Config.md).[`localDb`](Config.md#localdb)

***

### locale?

> `optional` **locale**: [`Locale`](Locale.md)

Defined in: [packages/mce/src/mixins/0.locale.ts:27](https://github.com/qq15725/mce/blob/865b01d697eb28080c375f733b243ebfb2a27a39/packages/mce/src/mixins/0.locale.ts#L27)

***

### madeWith?

> `optional` **madeWith**: `boolean`

Defined in: [packages/mce/src/plugins/madeWith.ts:7](https://github.com/qq15725/mce/blob/865b01d697eb28080c375f733b243ebfb2a27a39/packages/mce/src/plugins/madeWith.ts#L7)

#### Inherited from

[`Config`](Config.md).[`madeWith`](Config.md#madewith)

***

### msaa?

> `optional` **msaa**: `boolean`

Defined in: [packages/mce/src/mixins/0.config/base.ts:30](https://github.com/qq15725/mce/blob/865b01d697eb28080c375f733b243ebfb2a27a39/packages/mce/src/mixins/0.config/base.ts#L30)

#### Inherited from

[`Config`](Config.md).[`msaa`](Config.md#msaa)

***

### nodeCreator?

> `optional` **nodeCreator**: `boolean`

Defined in: [packages/mce/src/plugins/node.ts:11](https://github.com/qq15725/mce/blob/865b01d697eb28080c375f733b243ebfb2a27a39/packages/mce/src/plugins/node.ts#L11)

#### Inherited from

[`Config`](Config.md).[`nodeCreator`](Config.md#nodecreator)

***

### pixelate?

> `optional` **pixelate**: `boolean`

Defined in: [packages/mce/src/mixins/0.config/base.ts:34](https://github.com/qq15725/mce/blob/865b01d697eb28080c375f733b243ebfb2a27a39/packages/mce/src/mixins/0.config/base.ts#L34)

#### Inherited from

[`Config`](Config.md).[`pixelate`](Config.md#pixelate)

***

### pixelGrid?

> `optional` **pixelGrid**: `boolean`

Defined in: [packages/mce/src/mixins/0.config/base.ts:33](https://github.com/qq15725/mce/blob/865b01d697eb28080c375f733b243ebfb2a27a39/packages/mce/src/mixins/0.config/base.ts#L33)

#### Inherited from

[`Config`](Config.md).[`pixelGrid`](Config.md#pixelgrid)

***

### ruler?

> `optional` **ruler**: `boolean`

Defined in: [packages/mce/src/plugins/ruler.ts:7](https://github.com/qq15725/mce/blob/865b01d697eb28080c375f733b243ebfb2a27a39/packages/mce/src/plugins/ruler.ts#L7)

#### Inherited from

[`Config`](Config.md).[`ruler`](Config.md#ruler)

***

### screenCenterOffset?

> `optional` **screenCenterOffset**: [`ScreenOffset`](ScreenOffset.md)

Defined in: [packages/mce/src/mixins/0.config/base.ts:41](https://github.com/qq15725/mce/blob/865b01d697eb28080c375f733b243ebfb2a27a39/packages/mce/src/mixins/0.config/base.ts#L41)

#### Inherited from

[`Config`](Config.md).[`screenCenterOffset`](Config.md#screencenteroffset)

***

### scrollbar?

> `optional` **scrollbar**: `boolean`

Defined in: [packages/mce/src/plugins/scroll.ts:27](https://github.com/qq15725/mce/blob/865b01d697eb28080c375f733b243ebfb2a27a39/packages/mce/src/plugins/scroll.ts#L27)

#### Inherited from

[`Config`](Config.md).[`scrollbar`](Config.md#scrollbar)

***

### statusbar?

> `optional` **statusbar**: `boolean`

Defined in: [packages/mce/src/plugins/statusbar.ts:7](https://github.com/qq15725/mce/blob/865b01d697eb28080c375f733b243ebfb2a27a39/packages/mce/src/plugins/statusbar.ts#L7)

#### Inherited from

[`Config`](Config.md).[`statusbar`](Config.md#statusbar)

***

### t?

> `optional` **t**: [`Translation`](../type-aliases/Translation.md)

Defined in: [packages/mce/src/mixins/0.locale.ts:26](https://github.com/qq15725/mce/blob/865b01d697eb28080c375f733b243ebfb2a27a39/packages/mce/src/mixins/0.locale.ts#L26)

***

### theme?

> `optional` **theme**: [`Theme`](../type-aliases/Theme.md)

Defined in: [packages/mce/src/mixins/0.config/base.ts:28](https://github.com/qq15725/mce/blob/865b01d697eb28080c375f733b243ebfb2a27a39/packages/mce/src/mixins/0.config/base.ts#L28)

#### Inherited from

[`Config`](Config.md).[`theme`](Config.md#theme)

***

### timeline?

> `optional` **timeline**: `boolean`

Defined in: [packages/mce/src/plugins/timeline.ts:7](https://github.com/qq15725/mce/blob/865b01d697eb28080c375f733b243ebfb2a27a39/packages/mce/src/plugins/timeline.ts#L7)

#### Inherited from

[`Config`](Config.md).[`timeline`](Config.md#timeline)

***

### toolbelt?

> `optional` **toolbelt**: `boolean`

Defined in: [packages/mce/src/plugins/toolbelt.ts:7](https://github.com/qq15725/mce/blob/865b01d697eb28080c375f733b243ebfb2a27a39/packages/mce/src/plugins/toolbelt.ts#L7)

#### Inherited from

[`Config`](Config.md).[`toolbelt`](Config.md#toolbelt)

***

### transformControls?

> `optional` **transformControls**: [`TransformControlsConfig`](TransformControlsConfig.md)

Defined in: [packages/mce/src/mixins/0.config/base.ts:39](https://github.com/qq15725/mce/blob/865b01d697eb28080c375f733b243ebfb2a27a39/packages/mce/src/mixins/0.config/base.ts#L39)

#### Inherited from

[`Config`](Config.md).[`transformControls`](Config.md#transformcontrols)

***

### typographyStrategy?

> `optional` **typographyStrategy**: [`TypographyStrategy`](../type-aliases/TypographyStrategy.md)

Defined in: [packages/mce/src/mixins/0.config/base.ts:38](https://github.com/qq15725/mce/blob/865b01d697eb28080c375f733b243ebfb2a27a39/packages/mce/src/mixins/0.config/base.ts#L38)

#### Inherited from

[`Config`](Config.md).[`typographyStrategy`](Config.md#typographystrategy)

***

### watermark?

> `optional` **watermark**: `string`

Defined in: [packages/mce/src/mixins/0.config/base.ts:29](https://github.com/qq15725/mce/blob/865b01d697eb28080c375f733b243ebfb2a27a39/packages/mce/src/mixins/0.config/base.ts#L29)

#### Inherited from

[`Config`](Config.md).[`watermark`](Config.md#watermark)

***

### zoomToFit?

> `optional` **zoomToFit**: [`ZoomToMode`](../type-aliases/ZoomToMode.md)

Defined in: [packages/mce/src/plugins/zoom.ts:29](https://github.com/qq15725/mce/blob/865b01d697eb28080c375f733b243ebfb2a27a39/packages/mce/src/plugins/zoom.ts#L29)

#### Inherited from

[`Config`](Config.md).[`zoomToFit`](Config.md#zoomtofit)

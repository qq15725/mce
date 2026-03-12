[**mce**](../../../../README.md)

***

[mce](../../../../README.md) / [Mce](../README.md) / Options

# Interface: Options

Defined in: [packages/mce/src/mixins/0.locale.ts:25](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/0.locale.ts#L25)

## Extends

- `DeepMaybe`\<[`Config`](Config.md)\>

## Properties

### canvas?

> `optional` **canvas**: `object`

Defined in: [packages/mce/src/mixins/0.config/base.ts:63](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/0.config/base.ts#L63)

#### checkerboard?

> `optional` **checkerboard**: `object`

##### checkerboard.enabled?

> `optional` **enabled**: `boolean`

##### checkerboard.style?

> `optional` **style**: `"grid"` \| `"gridDark"` \| `"dot"`

#### frame?

> `optional` **frame**: `object`

##### frame.gap?

> `optional` **gap**: `number`

##### frame.outline?

> `optional` **outline**: `boolean`

##### frame.thumbnail?

> `optional` **thumbnail**: `boolean`

#### msaa?

> `optional` **msaa**: `object`

##### msaa.enabled?

> `optional` **enabled**: `boolean`

#### pixelate?

> `optional` **pixelate**: `object`

##### pixelate.enabled?

> `optional` **enabled**: `boolean`

#### pixelGrid?

> `optional` **pixelGrid**: `object`

##### pixelGrid.enabled?

> `optional` **enabled**: `boolean`

#### watermark?

> `optional` **watermark**: `object`

##### watermark.alpha?

> `optional` **alpha**: `number`

##### watermark.rotation?

> `optional` **rotation**: `number`

##### watermark.url?

> `optional` **url**: `string`

##### watermark.width?

> `optional` **width**: `number`

***

### clipboard?

> `optional` **clipboard**: `boolean`

Defined in: [packages/mce/src/plugins/edit.ts:43](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/edit.ts#L43)

***

### customContextMenu()?

> `optional` **customContextMenu**: (`defaultMenu`, `editor`) => [`MenuItem`](MenuItem.md)[]

Defined in: [packages/mce/src/plugins/menu.ts:27](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/menu.ts#L27)

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

Defined in: [packages/mce/src/mixins/1.upload.ts:12](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/1.upload.ts#L12)

***

### db?

> `optional` **db**: `object`

Defined in: [packages/mce/src/mixins/0.config/base.ts:61](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/0.config/base.ts#L61)

#### local?

> `optional` **local**: `boolean`

***

### doc?

> `optional` **doc**: [`DocumentSource`](../type-aliases/DocumentSource.md)

Defined in: [packages/mce/src/plugins/doc.ts:9](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/doc.ts#L9)

***

### hotkeys?

> `optional` **hotkeys**: `object`[]

Defined in: [packages/mce/src/mixins/hotkey.ts:22](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/hotkey.ts#L22)

#### command?

> `optional` **command**: `string`

#### editable?

> `optional` **editable**: `boolean`

#### enabled?

> `optional` **enabled**: `boolean`

#### key?

> `optional` **key**: `string` \| (`string` \| `undefined`)[]

#### preventDefault?

> `optional` **preventDefault**: `boolean`

#### system?

> `optional` **system**: `boolean`

***

### http?

> `optional` **http**: [`Http`](Http.md)

Defined in: [packages/mce/src/mixins/http.ts:38](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/http.ts#L38)

***

### interaction?

> `optional` **interaction**: `object`

Defined in: [packages/mce/src/mixins/0.config/base.ts:65](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/0.config/base.ts#L65)

#### transform?

> `optional` **transform**: `object`

##### transform.handleShape?

> `optional` **handleShape**: `"rect"` \| `"circle"`

##### transform.handleStyle?

> `optional` **handleStyle**: `"8-points"` \| `"4-points"`

##### transform.lockAspectRatioStrategy?

> `optional` **lockAspectRatioStrategy**: `"all"` \| `"diagonal"`

##### transform.rotator?

> `optional` **rotator**: `boolean`

***

### locale?

> `optional` **locale**: [`Locale`](Locale.md)

Defined in: [packages/mce/src/mixins/0.locale.ts:27](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/0.locale.ts#L27)

***

### t?

> `optional` **t**: [`Translation`](../type-aliases/Translation.md)

Defined in: [packages/mce/src/mixins/0.locale.ts:26](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/0.locale.ts#L26)

***

### typography?

> `optional` **typography**: `object`

Defined in: [packages/mce/src/plugins/typography.ts:17](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/plugins/typography.ts#L17)

#### defaultFont?

> `optional` **defaultFont**: `string` \| \{ `family?`: `string` \| (`string` \| `undefined`)[]; `src?`: `string`; \}

#### strategy?

> `optional` **strategy**: `"autoHeight"` \| `"autoWidth"` \| `"fixedWidthHeight"` \| `"autoFontSize"`

***

### ui?

> `optional` **ui**: `object`

Defined in: [packages/mce/src/mixins/0.config/base.ts:62](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/0.config/base.ts#L62)

#### creator?

> `optional` **creator**: `object`

##### creator.visible?

> `optional` **visible**: `boolean`

#### madeWith?

> `optional` **madeWith**: `object`

##### madeWith.visible?

> `optional` **visible**: `boolean`

#### ruler?

> `optional` **ruler**: `object`

##### ruler.adsorbed?

> `optional` **adsorbed**: `boolean`

##### ruler.lineColor?

> `optional` **lineColor**: `string`

##### ruler.locked?

> `optional` **locked**: `boolean`

##### ruler.visible?

> `optional` **visible**: `boolean`

#### scrollbar?

> `optional` **scrollbar**: `object`

##### scrollbar.visible?

> `optional` **visible**: `boolean`

#### statusbar?

> `optional` **statusbar**: `object`

##### statusbar.visible?

> `optional` **visible**: `boolean`

#### timeline?

> `optional` **timeline**: `object`

##### timeline.visible?

> `optional` **visible**: `boolean`

#### toolbelt?

> `optional` **toolbelt**: `object`

##### toolbelt.visible?

> `optional` **visible**: `boolean`

***

### viewport?

> `optional` **viewport**: `object`

Defined in: [packages/mce/src/mixins/0.config/base.ts:64](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/0.config/base.ts#L64)

#### camera?

> `optional` **camera**: `object`

##### camera.enabled?

> `optional` **enabled**: `boolean`

#### screenPadding?

> `optional` **screenPadding**: `object`

##### screenPadding.bottom?

> `optional` **bottom**: `number`

##### screenPadding.left?

> `optional` **left**: `number`

##### screenPadding.right?

> `optional` **right**: `number`

##### screenPadding.top?

> `optional` **top**: `number`

#### zoom?

> `optional` **zoom**: `object`

##### zoom.strategy?

> `optional` **strategy**: `"cover"` \| `"contain"` \| `"containWidth"` \| `"containHeight"`

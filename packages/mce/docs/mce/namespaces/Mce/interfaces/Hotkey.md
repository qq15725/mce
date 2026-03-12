[**mce**](../../../../README.md)

***

[mce](../../../../README.md) / [Mce](../README.md) / Hotkey

# Interface: Hotkey

Defined in: [packages/mce/src/mixins/hotkey.ts:34](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/hotkey.ts#L34)

## Extends

- [`HotkeyData`](HotkeyData.md)

## Properties

### command

> **command**: `string`

Defined in: [packages/mce/src/mixins/hotkey.ts:26](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/hotkey.ts#L26)

#### Inherited from

[`HotkeyData`](HotkeyData.md).[`command`](HotkeyData.md#command)

***

### editable?

> `optional` **editable**: `boolean`

Defined in: [packages/mce/src/mixins/hotkey.ts:28](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/hotkey.ts#L28)

#### Inherited from

[`HotkeyData`](HotkeyData.md).[`editable`](HotkeyData.md#editable)

***

### enabled?

> `optional` **enabled**: `boolean`

Defined in: [packages/mce/src/mixins/hotkey.ts:29](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/hotkey.ts#L29)

#### Inherited from

[`HotkeyData`](HotkeyData.md).[`enabled`](HotkeyData.md#enabled)

***

### handle()?

> `optional` **handle**: (`e`) => `void`

Defined in: [packages/mce/src/mixins/hotkey.ts:36](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/hotkey.ts#L36)

#### Parameters

##### e

`KeyboardEvent`

#### Returns

`void`

***

### key

> **key**: `string` \| `string`[]

Defined in: [packages/mce/src/mixins/hotkey.ts:27](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/hotkey.ts#L27)

#### Inherited from

[`HotkeyData`](HotkeyData.md).[`key`](HotkeyData.md#key)

***

### preventDefault?

> `optional` **preventDefault**: `boolean`

Defined in: [packages/mce/src/mixins/hotkey.ts:31](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/hotkey.ts#L31)

#### Inherited from

[`HotkeyData`](HotkeyData.md).[`preventDefault`](HotkeyData.md#preventdefault)

***

### system?

> `optional` **system**: `boolean`

Defined in: [packages/mce/src/mixins/hotkey.ts:30](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/hotkey.ts#L30)

#### Inherited from

[`HotkeyData`](HotkeyData.md).[`system`](HotkeyData.md#system)

***

### when()?

> `optional` **when**: (`e`) => `boolean`

Defined in: [packages/mce/src/mixins/hotkey.ts:35](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/hotkey.ts#L35)

#### Parameters

##### e

`KeyboardEvent`

#### Returns

`boolean`

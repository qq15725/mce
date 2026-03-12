[**mce**](../../../../README.md)

***

[mce](../../../../README.md) / [Mce](../README.md) / Loader

# Interface: Loader

Defined in: [packages/mce/src/mixins/loader.ts:9](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/loader.ts#L9)

## Properties

### accept?

> `optional` **accept**: `string`

Defined in: [packages/mce/src/mixins/loader.ts:11](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/loader.ts#L11)

***

### load()

> **load**: (`source`) => `Promise`\<`NormalizedElement`\<`Meta`\> \| `NormalizedElement`\<`Meta`\>[]\>

Defined in: [packages/mce/src/mixins/loader.ts:13](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/loader.ts#L13)

#### Parameters

##### source

`any`

#### Returns

`Promise`\<`NormalizedElement`\<`Meta`\> \| `NormalizedElement`\<`Meta`\>[]\>

***

### name

> **name**: `string`

Defined in: [packages/mce/src/mixins/loader.ts:10](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/loader.ts#L10)

***

### test()

> **test**: (`source`) => `boolean` \| `Promise`\<`boolean`\>

Defined in: [packages/mce/src/mixins/loader.ts:12](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/loader.ts#L12)

#### Parameters

##### source

`any`

#### Returns

`boolean` \| `Promise`\<`boolean`\>

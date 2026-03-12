[**mce**](../../../../README.md)

***

[mce](../../../../README.md) / [Mce](../README.md) / CommandEvents

# Type Alias: CommandEvents

> **CommandEvents** = `` { [K in keyof Commands as `command:${K}`]: [ReturnType<Commands[K]>] } ``

Defined in: [packages/mce/src/mixins/0.command.ts:14](https://github.com/qq15725/mce/blob/c6f24ea1c08be30a2b98716c58c6477e32dfd4c1/packages/mce/src/mixins/0.command.ts#L14)

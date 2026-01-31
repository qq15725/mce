[**mce**](../../../../README.md)

***

[mce](../../../../README.md) / [Mce](../README.md) / CommandEvents

# Type Alias: CommandEvents

> **CommandEvents** = `` { [K in keyof Commands as `command:${K}`]: [ReturnType<Commands[K]>] } ``

Defined in: [packages/mce/src/mixins/0.command.ts:14](https://github.com/qq15725/mce/blob/865b01d697eb28080c375f733b243ebfb2a27a39/packages/mce/src/mixins/0.command.ts#L14)

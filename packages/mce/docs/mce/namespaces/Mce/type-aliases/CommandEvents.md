[**mce**](../../../../README.md)

***

[mce](../../../../README.md) / [Mce](../README.md) / CommandEvents

# Type Alias: CommandEvents

> **CommandEvents** = `` { [K in keyof Commands as `command:${K}`]: [ReturnType<Commands[K]>] } ``

Defined in: [packages/mce/src/mixins/0.command.ts:14](https://github.com/qq15725/mce/blob/838928ddc21b3cae616f531f0828e6215d4523da/packages/mce/src/mixins/0.command.ts#L14)

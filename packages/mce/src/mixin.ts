import type { Editor, Options } from './editor'

export type Mixin = (editor: Editor, options: Options) =>
  | (() => (void | Promise<void>))
  | Mixin[]
  | Record<string, any>
  | undefined
  | void

export function defineMixin(cb: Mixin): Mixin {
  return cb
}

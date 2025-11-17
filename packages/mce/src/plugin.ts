import type { Component } from 'vue'
import type { Editor, Events, Options } from './editor'

export interface PluginComponent {
  type: 'overlay'
  ignore?: boolean | (() => boolean)
  component: Component
}

export interface PluginObject {
  name: string
  ignore?: boolean | (() => boolean)
  events?: { [K in keyof Events]: (...args: Events[K]) => void }
  commands?: Mce.Command[]
  hotkeys?: Mce.Hotkey[]
  loaders?: Mce.Loader[]
  exporters?: Mce.Exporter[]
  components?: PluginComponent[]
  setup?: () => void | Promise<void>
}

export type Plugin = PluginObject | ((editor: Editor, options: Options) => PluginObject)

export function definePlugin(cb: Plugin): Plugin {
  return cb
}

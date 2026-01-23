import type { Component } from 'vue'
import type { Editor, Events, Options } from './editor'

export interface PluginBaseComponent {
  ignore?: () => boolean
  component: Component
  order?: 'before' | number | 'after'
}

export interface PluginPanelComponent extends PluginBaseComponent {
  type: 'panel'
  name: string
  position:
    | 'float'
    | 'top' | 'right' | 'bottom' | 'left'
  size?: number
}

export interface PluginDialogComponent extends PluginBaseComponent {
  type: 'dialog'
}

export interface PluginOverlayComponent extends PluginBaseComponent {
  type: 'overlay'
}

export type PluginComponent
  = | PluginOverlayComponent
    | PluginDialogComponent
    | PluginPanelComponent

export interface PluginObject {
  name: string
  ignore?: () => boolean
  events?: { [K in keyof Events]: (...args: Events[K]) => void }
  commands?: Mce.Command[]
  hotkeys?: Mce.Hotkey[]
  loaders?: Mce.Loader[]
  exporters?: Mce.Exporter[]
  drawingTools?: Mce.DrawingTool[]
  components?: PluginComponent[]
  setup?: () => void | Promise<void>
}

export type Plugin
  = | PluginObject
    | ((editor: Editor, options: Options) => PluginObject)

export function definePlugin(cb: Plugin): Plugin {
  return cb
}

import type { Component, Ref } from 'vue'
import type { Editor, Events, Options } from './editor'

export interface PluginBaseComponent {
  component: Component
  visible?: Ref<boolean>
  order?: 'before' | number | 'after'
  slot?: string
}

export interface PluginPanelComponent extends PluginBaseComponent {
  type: 'panel'
  name: string
  position:
    | 'float'
    | 'top' | 'right' | 'bottom' | 'left'
  size?: number
  /** 停靠面板是否可拖拽调整尺寸（默认 false；尺寸跟随 size，需拖拽时显式设 true）。 */
  resizable?: boolean
  /** 停靠面板拖拽尺寸下限 / 上限。 */
  minSize?: number
  maxSize?: number
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

export function isPanelComponent<T extends { type?: string }>(c: T): c is T & PluginPanelComponent {
  return c.type === 'panel'
}

export function isOverlayComponent<T extends { type?: string }>(c: T): c is T & PluginOverlayComponent {
  return c.type === 'overlay'
}

export function isDialogComponent<T extends { type?: string }>(c: T): c is T & PluginDialogComponent {
  return c.type === 'dialog'
}

export interface PluginObject {
  name: string
  ignore?: () => boolean
  events?: { [K in keyof Events]: (...args: Events[K]) => void }
  commands?: Mce.Command[]
  hotkeys?: Mce.Hotkey[]
  loaders?: Mce.Loader[]
  exporters?: Mce.Exporter[]
  tools?: Mce.Tool[]
  components?: PluginComponent[]
  /** 插件追加的 i18n 文案，按 locale 合并（如 { en: {...}, zhHans: {...} }）。 */
  messages?: Partial<Record<string, Mce.LocaleMessages>>
  setup?: () => void | Promise<void>
}

export type Plugin
  = | PluginObject
    | ((editor: Editor, options: Options) => PluginObject)

export function definePlugin(cb: Plugin): Plugin {
  return cb
}

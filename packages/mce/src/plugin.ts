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
  /**
   * 注册时机：`pre` 最先、`post` 最后，省略为普通顺序（按文件名字母序）。
   * 影响事件监听执行顺序——如 smartGuides 用 `post` 确保在 transform 吸附移动元素后再算辅助线。
   */
  enforce?: 'pre' | 'post'
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

export function definePlugin(cb: Plugin, options?: { enforce?: 'pre' | 'post' }): Plugin {
  // 把 enforce 标到插件（工厂函数或对象）上，使注册前无需调用工厂即可读取并排序。
  if (options?.enforce) {
    ;(cb as PluginObject).enforce = options.enforce
  }
  return cb
}

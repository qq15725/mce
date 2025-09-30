import type { RemovableRef } from '@vueuse/core'
import type { App, InjectionKey } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import { EventEmitter } from 'modern-idoc'
import { ref } from 'vue'
import { presetPlugins } from './preset-plugins'

export interface EditorOptions extends Mce.EditorOptions {
  debug?: boolean
  plugins?: EditorPlugin[]
  configCacheInLocal?: boolean
}

export interface Editor extends Mce.Editor {
  //
}

export class Editor extends EventEmitter<Mce.Events> {
  static injectionKey: InjectionKey<Editor> = Symbol.for('EditorKey')

  debug = ref(false)
  declare config: RemovableRef<Mce.Config>
  onEmit?: <K extends keyof Mce.Events>(event: K, ...args: Mce.Events[K]) => void

  constructor(options: EditorOptions = {}) {
    super()

    this._setupEventEmitter()
    this._setupOptions(options)
  }

  protected _setupEventEmitter(): void {
    this.addEventListener = this.addEventListener.bind(this)
    this.removeEventListener = this.removeEventListener.bind(this)
    this.removeAllListeners = this.removeAllListeners.bind(this)
    this.hasEventListener = this.hasEventListener.bind(this)
    this.dispatchEvent = this.dispatchEvent.bind(this)
    this.on = this.on.bind(this)
    this.once = this.once.bind(this)
    this.off = this.off.bind(this)
    this.emit = this.emit.bind(this)
  }

  log = (...args: any[]): void => {
    if (this.debug.value) {
      console.warn(`[mce][${new Date().toLocaleTimeString()}]`, ...args)
    }
  }

  emit = <K extends keyof Mce.Events>(event: K, ...args: Mce.Events[K]): void => {
    this.onEmit?.(event, ...args)
    super.emit(event, ...args)
  }

  protected _setupOptions(options: EditorOptions): void {
    const {
      debug = false,
      plugins = [],
      configCacheInLocal,
    } = options

    this.debug.value = debug
    this.config = configCacheInLocal
      ? useLocalStorage<Mce.Config>('config', () => ({} as any))
      : ref({} as any)

    this._setupPlugins([
      ...presetPlugins,
      ...plugins,
    ], options)
  }

  protected _setupPlugins(plugins: EditorPlugin[], options: EditorOptions): void {
    const installs: any[] = []

    const use = (plugin: EditorPlugin): void => {
      const result = plugin(this, options)
      switch (typeof result) {
        case 'object':
          if (Array.isArray(result)) {
            result.map(v => use(v))
          }
          else {
            Object.assign(this, result)
          }
          break
        case 'function':
        default:
          installs.push(result)
          break
      }
    }

    plugins.map(use)

    installs.forEach(install => (install as any)?.(this, options))
  }

  provideProperties = <K extends keyof Editor>(
    properties: Record<K, Editor[K]>,
    override?: boolean,
  ): void => {
    for (const key in properties) {
      if (override || (this as any)[key] === undefined) {
        (this as any)[key] = properties[key]
      }
    }
  }

  install = (app: App): void => {
    app.provide(Editor.injectionKey, this)
  }
}

export function createEditor(options?: EditorOptions): Editor {
  return new Editor(options)
}

export type EditorPlugin = (editor: Editor, options: EditorOptions) =>
  | ((editor: Editor, options: EditorOptions) => void)
  | EditorPlugin[]
  | Record<string, any>
  | undefined
  | void

export function definePlugin(cb: EditorPlugin): EditorPlugin {
  return cb
}

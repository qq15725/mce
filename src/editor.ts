import type { RemovableRef } from '@vueuse/core'
import type { ObservableEvents } from 'modern-idoc'
import type { App, InjectionKey } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import { Observable } from 'modern-idoc'
import { ref } from 'vue'
import { presetPlugins } from './preset-plugins'

export interface Options extends Mce.Options {
  debug?: boolean
  plugins?: Plugin[]
  configCacheInLocal?: boolean
}

export interface Editor extends Mce.Editor {
  //
}

export interface Events extends Mce.Events, ObservableEvents {
  //
}

export class Editor extends Observable<Events> {
  static injectionKey: InjectionKey<Editor> = Symbol.for('EditorKey')

  debug = ref(false)
  declare config: RemovableRef<Mce.Config>
  onEmit?: <K extends keyof Events & string>(event: K, ...args: Events[K]) => void

  constructor(options: Options = {}) {
    super()

    this._setupObservable()
    this._setupOptions(options)
  }

  protected _setupObservable(): void {
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

  emit = <K extends keyof Events & string>(event: K, ...args: Events[K]): this => {
    this.onEmit?.(event, ...args)
    return super.emit(event, ...args)
  }

  protected _setupOptions(options: Options): void {
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

  protected _setupPlugins(plugins: Plugin[], options: Options): void {
    const installs: any[] = []

    const use = (plugin: Plugin): void => {
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

  install = (app: App): void => {
    app.provide(Editor.injectionKey, this)
  }
}

export function createEditor(options?: Options): Editor {
  return new Editor(options)
}

export type Plugin = (editor: Editor, options: Options) =>
  | ((editor: Editor, options: Options) => void)
  | Plugin[]
  | Record<string, any>
  | undefined
  | void

export function definePlugin(cb: Plugin): Plugin {
  return cb
}

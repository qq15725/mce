import type { RemovableRef } from '@vueuse/core'
import type { ObservableEvents } from 'modern-idoc'
import type { App, InjectionKey } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import { Observable } from 'modern-idoc'
import { ref } from 'vue'
import { mixins as presetMixins } from './mixins'
import { plugins as presetPlugins } from './plugins'

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
  plugins = new Map<string, PluginObject>()

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

    this._setupMixins(
      presetMixins,
      options,
    )

    this._setupPlugins([
      ...presetPlugins,
      ...plugins,
    ], options)
  }

  protected _setupMixins(mixins: Mixin[], options: Options): void {
    const installs: any[] = []

    const use = (mixin: Mixin): void => {
      const result = mixin(this, options)
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

    mixins.forEach(use)

    installs.forEach(install => (install as any)?.(this, options))
  }

  protected _setupPlugins(plugins: Plugin[], options: Options): void {
    const use = (plugin: Plugin): void => {
      let result: PluginObject
      if (typeof plugin === 'function') {
        result = plugin(this, options)
      }
      else {
        result = plugin
      }

      this.plugins.set(result.name, result)

      const {
        commands = [],
        hotkeys = [],
        loaders = [],
        exporters = [],
      } = result

      this.registerCommand(commands)
      this.registerHotkey(hotkeys)
      this.registerLoader(loaders)
      this.registerExporter(exporters)
    }

    plugins.forEach((p) => {
      try {
        use(p)
      }
      catch (err: any) {
        console.error(`Failed to use plugin`, err)
      }
    })

    this.plugins.forEach((p) => {
      try {
        p.setup?.()
      }
      catch (err: any) {
        console.error(`Failed to setup ${p.name} plugin`, err)
      }
    })
  }

  install = (app: App): void => {
    app.provide(Editor.injectionKey, this)
  }
}

export function createEditor(options?: Options): Editor {
  return new Editor(options)
}

export interface PluginObject {
  name: string
  commands?: Mce.Command[]
  hotkeys?: Mce.Hotkey[]
  loaders?: Mce.Loader[]
  exporters?: Mce.Exporter[]
  setup?: () => void
}

export type Plugin = PluginObject | ((editor: Editor, options: Options) => PluginObject)

export function definePlugin(cb: Plugin): Plugin {
  return cb
}

export type Mixin = (editor: Editor, options: Options) =>
  | ((editor: Editor, options: Options) => void)
  | Mixin[]
  | Record<string, any>
  | undefined
  | void

export function defineMixin(cb: Mixin): Mixin {
  return cb
}

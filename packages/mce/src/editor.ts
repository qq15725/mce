import type { RemovableRef } from '@vueuse/core'
import type { ObservableEvents } from 'modern-idoc'
import type { App, Component, InjectionKey } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import { Observable } from 'modern-idoc'
import { computed, ref } from 'vue'
import { mixins as presetMixins } from './mixins'
import { plugins as presetPlugins } from './plugins'

export interface Options extends Mce.Options {
  debug?: boolean
  showMadeWith?: boolean
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
  showMadeWith = ref(false)
  declare config: RemovableRef<Mce.Config>
  onEmit?: <K extends keyof Events & string>(event: K, ...args: Events[K]) => void
  plugins = new Map<string, PluginObject>()
  overlays = computed<Component[]>(() => {
    return Array.from(this.plugins.values())
      .flatMap(p => p.components?.filter((c) => {
        return c.type === 'overlay' && c.ignore?.() !== true
      }) ?? [])
      .map(c => c.component)
  })

  protected _setups: (() => void | Promise<void>)[] = []

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
      showMadeWith = false,
      plugins = [],
      configCacheInLocal,
    } = options

    this.debug.value = debug
    this.showMadeWith.value = showMadeWith
    this.config = configCacheInLocal
      ? useLocalStorage<Mce.Config>('config', () => ({} as any))
      : ref({} as any)

    this._setups = []

    this._useMixins(
      presetMixins,
      options,
    )

    this.use([
      ...presetPlugins,
      ...plugins,
    ], options)
  }

  protected _useMixins(mixins: Mixin[], options: Options): void {
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
          if (result) {
            this._setups.push(result)
          }
          break
      }
    }

    mixins.forEach(use)
  }

  use(plugins: Plugin[], options: Options): void {
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
        events,
      } = result

      this.registerCommand(commands)
      this.registerHotkey(hotkeys)
      this.registerLoader(loaders)
      this.registerExporter(exporters)

      if (events) {
        for (const k in events) {
          this.on(k, events[k])
        }
      }
    }

    plugins.forEach((p) => {
      try {
        use(p)
      }
      catch (err: any) {
        console.error(`Failed to use plugin`, err)
      }
    })
  }

  protected _setuped = false

  setup = async () => {
    if (!this._setuped) {
      this._setuped = true

      await Promise.all([
        ...this._setups.map(async (setup) => {
          try {
            await setup()
          }
          catch (err: any) {
            console.error(`Failed to setup mixin`, err)
          }
        }),
        ...[...this.plugins.values()].map(async (p) => {
          try {
            await p.setup?.()
          }
          catch (err: any) {
            console.error(`Failed to setup ${p.name} plugin`, err)
          }
        }),
      ])

      this.emit('ready')
    }
  }

  install = (app: App): void => {
    app.provide(Editor.injectionKey, this)
  }
}

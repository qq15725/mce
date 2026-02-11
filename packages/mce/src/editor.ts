import type { EffectScope } from '@vue/reactivity'
import type { ObservableEvents } from 'modern-idoc'
import type { App, ComponentPublicInstance, InjectionKey, Ref } from 'vue'
import type { Mixin } from './mixin'
import type {
  Plugin,
  PluginComponent,
  PluginObject,
} from './plugin'
import { useLocalStorage } from '@vueuse/core'
import { Observable } from 'modern-idoc'
import { computed, effectScope, ref } from 'vue'
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

export interface Slots extends Mce.Slots {
  //
}

export type EditorComponent = PluginComponent & { plugin: string, indexInPlugin: number }

export class Editor extends Observable<Events> {
  static injectionKey: InjectionKey<Editor> = Symbol.for('EditorKey')

  debug = ref(false)
  declare config: Ref<Mce.Config>
  onEmit?: <K extends keyof Events & string>(event: K, ...args: Events[K]) => void
  plugins: Record<string, PluginObject> = {}

  protected _pluginComponentTypes = ['panel', 'overlay', 'dialog']

  components = computed(() => {
    const groups: Record<string, EditorComponent[]> = {}
    const keys = Object.keys(this.plugins)
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]
      const p = this.plugins[key]
      p.components?.forEach((c, index) => {
        if (c.ignore?.() === true) {
          return
        }
        if (!groups[c.type]) {
          groups[c.type] = []
        }
        groups[c.type].push({
          ...c,
          plugin: p.name,
          indexInPlugin: index,
        })
      })
    }

    const components = [] as EditorComponent[]
    this._pluginComponentTypes.forEach((type) => {
      const items = (groups[type] ?? []) as EditorComponent[]
      items
        .filter(c => c.order === 'before')
        .forEach((c) => {
          components.push(c)
        })
      items
        .filter(c => c.order !== 'before' && c.order !== 'after')
        .sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0))
        .forEach((c) => {
          components.push(c)
        })
      items
        .filter(c => c.order === 'after')
        .forEach((c) => {
          components.push(c)
        })
    })

    return components
  })

  componentRefs = ref<Record<string, (HTMLElement | ComponentPublicInstance | null)[]>>({})

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
      plugins = [],
      configCacheInLocal,
    } = options

    this.debug.value = debug
    this.config = configCacheInLocal
      ? useLocalStorage<Mce.Config>('config', () => ({} as any))
      : ref({} as any)

    this._setups = []

    this.mixin(
      presetMixins,
      options,
    )

    this.use([
      ...presetPlugins,
      ...plugins,
    ], options)
  }

  mixin(mixin: Mixin | Mixin[], options: Options = {}): void {
    if (Array.isArray(mixin)) {
      mixin.forEach((item) => {
        try {
          this.mixin(item, options)
        }
        catch (err: any) {
          console.error(`Failed to use mixin`, err)
        }
      })
    }
    else {
      const result = mixin(this, options)
      switch (typeof result) {
        case 'object':
          if (Array.isArray(result)) {
            result.map(v => this.mixin(v))
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
  }

  use(plugin: Plugin | Plugin[], options: Options): void {
    if (Array.isArray(plugin)) {
      plugin.forEach((p) => {
        try {
          this.use(p, options)
        }
        catch (err: any) {
          console.error(`Failed to use plugin`, err)
        }
      })
    }
    else {
      let result: PluginObject
      if (typeof plugin === 'function') {
        result = plugin(this, options)
      }
      else {
        result = plugin
      }

      this.plugins[result.name] = result

      const {
        events,
        commands = [],
        hotkeys = [],
        loaders = [],
        exporters = [],
        tools = [],
      } = result

      this.registerCommand(commands)
      this.registerHotkey(hotkeys)
      this.registerLoader(loaders)
      this.registerExporter(exporters)
      this.registerTool(tools)

      if (events) {
        for (const k in events) {
          this.on(k, events[k])
        }
      }
    }
  }

  protected _effectScope?: EffectScope

  setup = async () => {
    this._effectScope?.stop()
    const scope = effectScope()
    scope.run(async () => {
      await Promise.all([
        ...this._setups.map(async (setup) => {
          try {
            await setup()
          }
          catch (err: any) {
            console.error(`Failed to setup mixin`, err)
          }
        }),
        ...Object.values(this.plugins).map(async (p) => {
          try {
            await p.setup?.()
          }
          catch (err: any) {
            console.error(`Failed to setup ${p.name} plugin`, err)
          }
        }),
      ])
      this.emit('ready')
    })
    this._effectScope = scope
  }

  install = (app: App): void => {
    app.provide(Editor.injectionKey, this)
  }
}

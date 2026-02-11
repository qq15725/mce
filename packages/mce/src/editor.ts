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
import { computed, effectScope, reactive, ref, shallowRef } from 'vue'
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

export type EditorComponent = PluginComponent & {
  visible: Ref<boolean>
  plugin: string
  indexInPlugin: number
}

export class Editor extends Observable<Events> {
  static injectionKey: InjectionKey<Editor> = Symbol.for('EditorKey')

  debug = ref(false)
  declare config: Ref<Mce.Config>
  onEmit?: <K extends keyof Events & string>(event: K, ...args: Events[K]) => void

  protected _pluginComponentTypes = ['panel', 'overlay', 'dialog']
  components = shallowRef<EditorComponent[]>([])
  sortedComponents = computed(() => {
    const groups: Record<string, EditorComponent[]> = {}
    this.components.value.forEach((c) => {
      if (!groups[c.type]) {
        groups[c.type] = []
      }
      groups[c.type].push(c)
    })
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

  componentRefs = reactive<Record<string, (HTMLElement | ComponentPublicInstance | null)[]>>({})

  setups: (() => void | Promise<void>)[] = []
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

      const {
        name,
        events,
        commands = [],
        hotkeys = [],
        loaders = [],
        exporters = [],
        tools = [],
        components = [],
        setup,
      } = result

      this.registerCommand(commands)
      this.registerHotkey(hotkeys)
      this.registerLoader(loaders)
      this.registerExporter(exporters)
      this.registerTool(tools)
      this.registerComponent(name, components)

      if (setup) {
        this.setups.push(setup)
      }

      if (events) {
        for (const k in events) {
          this.on(k, events[k])
        }
      }
    }
  }

  registerComponent(name: string, components: PluginComponent[]) {
    components.forEach((c, index) => {
      let visible = c.visible
      if (!visible) {
        switch (c.type) {
          case 'overlay':
            visible = ref(true)
            break
          case 'panel':
          default:
            visible = ref(false)
            break
        }
      }
      this.components.value.push({
        ...c,
        visible,
        plugin: name,
        indexInPlugin: index,
      })
    })
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
        ...Object.values(this.setups).map(async (setup) => {
          try {
            await setup()
          }
          catch (err: any) {
            console.error(`Failed to setup plugin`, err)
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

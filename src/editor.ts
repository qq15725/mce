import type { RemovableRef } from '@vueuse/core'
import type { FontSource } from 'modern-font'
import type { Document } from 'modern-idoc'
import type { App, InjectionKey } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import { merge } from 'lodash-es'
import { EventEmitter } from 'modern-idoc'
import { ref } from 'vue'
import { presetProviders } from './preset-providers'

type DeepPartial<T> = T extends object
  ? { [P in keyof T]?: DeepPartial<T[P]> }
  : T

export interface EditorOptions {
  debug?: boolean
  providers?: EditorProvider[]
  configCacheInLocal?: boolean
  config?: DeepPartial<Mce.Config>
  defaultFont?: FontSource
  doc?: Document
}

export interface Editor extends Mce.Editor {
  //
}

export class Editor extends EventEmitter<Mce.Events> {
  debug = ref(false)
  config: RemovableRef<Mce.Config>
  onEmit?: <K extends keyof Mce.Events>(event: K, ...args: Mce.Events[K]) => void

  static injectionKey: InjectionKey<Editor> = Symbol.for('EditorKey')

  log = (...args: any[]): void => {
    if (this.debug.value) {
      console.warn(`[mce][${new Date().toLocaleTimeString()}]`, ...args)
    }
  }

  constructor(options: EditorOptions = {}) {
    super()

    this.debug.value = options.debug || false
    const defaultConfig = { version: '0.0.0' } as Mce.Config
    this.config = options.configCacheInLocal
      ? useLocalStorage<Mce.Config>('config', () => defaultConfig)
      : ref(defaultConfig)

    this._setupEventEmitter()
    this._setupOptions(options)
    if (options.defaultFont) {
      this.setFallbackFont(options.defaultFont)
    }
    if (options.doc) {
      this.setDoc(options.doc)
    }
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

  emit<K extends keyof Mce.Events>(event: K, ...args: Mce.Events[K]): void {
    this.onEmit?.(event, ...args)
    super.emit(event, ...args)
  }

  protected _setupOptions(options: EditorOptions = {}): void {
    const {
      providers = [],
      config,
      ...properties
    } = options

    merge(this.config.value, config)

    this.provideProperties(properties as any)

    const allProviders = [
      ...presetProviders,
      ...providers,
    ]

    const installs: any[] = []

    const use = (provider: EditorProvider): void => {
      const result = provider(this)
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

    // Use providers
    allProviders.map(use)

    // Install providers
    installs.forEach(install => (install as any)?.(this))
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

export type EditorProvider = (editor: Editor) =>
  | ((editor: Editor) => void)
  | EditorProvider[]
  | Record<string, any>
  | undefined
  | void

export function createEditor(options?: EditorOptions): Editor {
  return new Editor(options)
}

export function defineProvider(cb: EditorProvider): EditorProvider {
  return cb
}

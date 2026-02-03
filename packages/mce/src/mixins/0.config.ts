import type { WritableComputedRef } from 'vue'
import { useFileDialog } from '@vueuse/core'
import { saveAs } from 'file-saver'
import { getObjectValueByPath, setObjectValueByPath } from 'modern-idoc'
import { computed } from 'vue'
import { defineMixin } from '../mixin'

declare global {
  namespace Mce {
    interface ConfigDeclaration<T = any> {
      default?: T | (() => T)
      getter?: (val: any) => any
      setter?: (val: any) => any
    }

    interface Editor {
      getConfigValue: (path: keyof Config | string, defaultValue?: any) => any
      setConfigValue: (path: keyof Config | string, value: any) => void
      getConfig: <T = any>(path: string) => WritableComputedRef<T>
      registerConfig: <T>(path: keyof Config | string, declaration?: ConfigDeclaration<T>) => WritableComputedRef<T>
      importConfig: () => Promise<void>
      exportConfig: () => Blob
      saveAsConfig: (filename?: string) => void
    }
  }
}

export default defineMixin((editor) => {
  const {
    config,
  } = editor

  const configDeclarations = new Map<string, Mce.ConfigDeclaration>()

  function getConfigValue(path: string, defaultValue?: any): any {
    let value = getObjectValueByPath(config.value, path)
    const declaration = configDeclarations.get(path)
    if (declaration?.getter) {
      value = declaration.getter(value)
    }
    return value ?? defaultValue
  }

  function setConfigValue(path: string, value: any): void {
    const declaration = configDeclarations.get(path)
    if (declaration?.setter) {
      value = declaration.setter(value)
    }
    setObjectValueByPath(config.value, path, value)
  }

  function getConfig<T = any>(path: string): WritableComputedRef<T> {
    return computed({
      get: () => getConfigValue(path),
      set: value => setConfigValue(path, value),
    })
  }

  function registerConfig<T>(path: string, declaration: Mce.ConfigDeclaration<T> = {}): WritableComputedRef<T> {
    configDeclarations.set(path, declaration)
    const ref = getConfig(path)
    if (ref.value === undefined) {
      if (typeof declaration.default === 'function') {
        ref.value = (declaration.default as any)()
      }
      else {
        ref.value = declaration.default
      }
    }
    return ref
  }

  function importConfig(): Promise<Mce.Config> {
    return new Promise((resolve) => {
      const { onChange, open } = useFileDialog({
        accept: '.json',
        reset: true,
        multiple: false,
      })

      onChange(async (files) => {
        const file = files?.[0]

        if (file) {
          // TODO 校验
          config.value = JSON.parse(await file.text())
          resolve(config.value)
        }
      })

      open()
    })
  }

  function exportConfig(): Blob {
    return new Blob([JSON.stringify(config.value)], { type: 'application/json' })
  }

  function saveAsConfig(filename = 'settings.json'): void {
    saveAs(
      exportConfig(),
      filename,
    )
  }

  Object.assign(editor, {
    getConfigValue,
    setConfigValue,
    getConfig,
    registerConfig,
    importConfig,
    exportConfig,
    saveAsConfig,
  })
})

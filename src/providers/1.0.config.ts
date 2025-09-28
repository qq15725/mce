import type { WritableComputedRef } from 'vue'
import { useFileDialog } from '@vueuse/core'
import { saveAs } from 'file-saver'
import { getObjectValueByPath, setObjectValueByPath } from 'modern-idoc'
import { computed } from 'vue'
import { defineProvider } from '../editor'

declare global {
  namespace Mce {
    interface Editor {
      getConfigValue: (path: keyof Config | string, defaultValue?: any) => any
      setConfigValue: (path: keyof Config | string, value: any) => void
      getConfig: <T = any>(path: string) => WritableComputedRef<T>
      registerConfig: <T>(path: keyof Config | string, initValue: T) => WritableComputedRef<T>
      importConfig: () => Promise<void>
      exportConfig: () => Blob
      saveAsConfig: (filename?: string) => void
    }
  }
}

export default defineProvider((editor) => {
  const {
    provideProperties,
    config,
  } = editor

  function getConfigValue(path: string, defaultValue?: any): any {
    return getObjectValueByPath(config.value, path) ?? defaultValue
  }

  function setConfigValue(path: string, value: any): void {
    setObjectValueByPath(config.value, path, value)
  }

  function getConfig<T = any>(path: string): WritableComputedRef<T> {
    return computed({
      get: () => getConfigValue(path),
      set: value => setConfigValue(path, value),
    })
  }

  function registerConfig<T>(path: string, initValue?: T): WritableComputedRef<T> {
    const ref = getConfig(path)
    if (ref.value === undefined) {
      ref.value = initValue
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

  provideProperties({
    getConfigValue,
    setConfigValue,
    getConfig,
    registerConfig,
    importConfig,
    exportConfig,
    saveAsConfig,
  })
})

import type { NormalizedElement } from 'modern-idoc'
import type { Ref } from 'vue'
import { useFileDialog } from '@vueuse/core'
import { ref } from 'vue'
import { defineProvider } from '../editor'
import { presetLoaders } from './loaders'

declare global {
  namespace Mce {
    interface Loader {
      name: string
      accept?: string
      test: (source: any) => boolean | Promise<boolean>
      load: (source: any) => Promise<NormalizedElement | undefined>
    }

    interface Editor {
      loaders: Ref<Map<string, Loader>>
      registerLoader: (loader: Loader | Loader[]) => void
      unregisterLoader: (name: string) => void
      load: <T = NormalizedElement>(source: any) => Promise<T>
      openFileDialog: (options?: { multiple?: boolean }) => Promise<File[]>
    }
  }
}

export default defineProvider((editor) => {
  const {
    provideProperties,
    setStatus,
  } = editor

  const loaders = ref(new Map<string, Mce.Loader>())

  const registerLoader: Mce.Editor['registerLoader'] = (loader) => {
    if (Array.isArray(loader)) {
      loader.forEach(v => registerLoader(v))
    }
    else {
      loaders.value.set(loader.name, loader)
    }
  }

  const unregisterLoader: Mce.Editor['unregisterLoader'] = (key) => {
    loaders.value.delete(key)
  }

  const load: Mce.Editor['load'] = async (source) => {
    setStatus('loading')
    let result: any | undefined
    try {
      for (const loader of loaders.value.values()) {
        if (await loader.test(source)) {
          result = await loader.load(source)
          break
        }
      }
    }
    finally {
      setStatus(undefined)
    }
    if (result === undefined) {
      throw new Error(`Failed to load source "${source}"`)
    }
    return result
  }

  const openFileDialog: Mce.Editor['openFileDialog'] = (options = {}) => {
    const {
      multiple = false,
    } = options

    return new Promise((resolve) => {
      const accepts: string[] = []
      for (const loader of loaders.value.values()) {
        if (loader.accept) {
          accepts.push(loader.accept)
        }
      }
      const accept = accepts.join(',')
      const { onChange, open } = useFileDialog({
        accept,
        reset: true,
        multiple,
      })
      onChange(files => resolve(files ? Array.from(files) : []))
      open()
    })
  }

  provideProperties({
    loaders,
    registerLoader,
    unregisterLoader,
    load,
    openFileDialog,
  })

  return presetLoaders
})

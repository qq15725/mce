import type { NormalizedElement } from 'modern-idoc'
import type { Reactive } from 'vue'
import { useFileDialog } from '@vueuse/core'
import { defineMixin } from '../mixin'
import { createMapRegistry } from '../utils'

declare global {
  namespace Mce {
    interface Loader {
      name: string
      accept?: string
      test: (source: any) => boolean | Promise<boolean>
      load: (source: any) => Promise<NormalizedElement | NormalizedElement[]>
    }

    interface Editor {
      loaders: Reactive<Map<string, Loader>>
      registerLoader: (value: Loader | Loader[]) => void
      unregisterLoader: (name: string) => void
      canLoad: (source: any) => Promise<boolean>
      load: <T = NormalizedElement>(source: any) => Promise<T[]>
      openFileDialog: (options?: { multiple?: boolean }) => Promise<File[]>
    }
  }
}

export default defineMixin((editor) => {
  const {
    state,
  } = editor

  const {
    map: loaders,
    register: registerLoader,
    unregister: unregisterLoader,
  } = createMapRegistry<Mce.Loader>(item => item.name)

  const canLoad: Mce.Editor['canLoad'] = async (source) => {
    for (const loader of loaders.values()) {
      if (await loader.test(source)) {
        return true
      }
    }
    return false
  }

  const load: Mce.Editor['load'] = async (source) => {
    state.value = 'loading'
    const items: any[] = []
    let hasLoader = false
    try {
      for (const loader of loaders.values()) {
        if (await loader.test(source)) {
          const res = await loader.load(source)
          if (Array.isArray(res)) {
            items.push(...res)
          }
          else {
            items.push(res)
          }
          hasLoader = true
          break
        }
      }
    }
    finally {
      state.value = undefined
    }
    if (!hasLoader) {
      throw new Error(`Failed to load source "${source}"`)
    }
    return items
  }

  const openFileDialog: Mce.Editor['openFileDialog'] = (options = {}) => {
    const {
      multiple = false,
    } = options

    return new Promise((resolve) => {
      const accepts: string[] = []
      for (const loader of loaders.values()) {
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

  Object.assign(editor, {
    loaders,
    registerLoader,
    unregisterLoader,
    canLoad,
    load,
    openFileDialog,
  })
})

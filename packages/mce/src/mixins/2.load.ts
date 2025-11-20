import type { NormalizedElement } from 'modern-idoc'
import type { Reactive } from 'vue'
import { useFileDialog } from '@vueuse/core'
import { reactive } from 'vue'
import { defineMixin } from '../mixin'

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

  const loaders: Mce.Editor['loaders'] = reactive(new Map())

  const registerLoader: Mce.Editor['registerLoader'] = (value) => {
    if (Array.isArray(value)) {
      value.forEach(v => registerLoader(v))
    }
    else {
      loaders.set(value.name, value)
    }
  }

  const unregisterLoader: Mce.Editor['unregisterLoader'] = (key) => {
    loaders.delete(key)
  }

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
          break
        }
      }
    }
    finally {
      state.value = undefined
    }
    if (!items.length) {
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

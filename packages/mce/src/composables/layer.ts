import type { Node } from 'modern-canvas'
import type {
  ComponentInternalInstance,
  InjectionKey,
  Ref,
} from 'vue'
import {
  computed,
  getCurrentInstance,
  inject,
  onBeforeUnmount,
  provide,
  reactive,
  ref,
} from 'vue'
import { findChildrenWithProvide } from '../utils'

interface LayerProvide {
  selecting: Ref<boolean>
  register: (
    vm: ComponentInternalInstance,
    options: {
      id: string
      dom: Ref<HTMLElement | undefined>
      opened: Ref<boolean>
    },
  ) => void
  unregister: (id: string) => void
}

export const MceLayerKey: InjectionKey<LayerProvide> = Symbol.for('mce:layer')
export const MceLayerItemKey: InjectionKey<{ id: string }> = Symbol.for('mce:layer-item')

export function createLayer() {
  const registered = ref<string[]>([])
  const selecting = ref(false)
  const openedItems = reactive(new Map<string, Ref<boolean>>())
  const domItems = reactive(new Map<string, Ref<HTMLElement | undefined>>())
  const rootVm = getCurrentInstance()!

  provide(MceLayerKey, {
    selecting,
    register: (vm, options) => {
      const {
        id,
        dom,
        opened,
      } = options
      openedItems.set(id, opened)
      domItems.set(id, dom)
      registered.value.push(id)
      const instances = findChildrenWithProvide(MceLayerItemKey, rootVm?.vnode)
      const instanceIndex = instances.indexOf(vm)
      if (instanceIndex > -1) {
        registered.value.splice(instanceIndex, 0, id)
      }
      else {
        registered.value.push(id)
      }
    },
    unregister: (id) => {
      openedItems.delete(id)
      domItems.delete(id)
      registered.value = registered.value.filter(v => v !== id)
    },
  })

  return {
    selecting,
    openedItems,
    domItems,
  }
}

export function useLayerItem(options: {
  id: string
  node: Ref<Node>
  selection: Ref<Node[]>
}) {
  const {
    id,
    node,
    selection,
  } = options

  const dom = ref<HTMLElement>()
  const opened = ref(false)
  const isActive = computed(() => selection.value.some(v => v.equal(node.value)))

  const vm = getCurrentInstance()!
  provide(MceLayerItemKey, { id })
  const rootLayer = inject(MceLayerKey)!
  rootLayer.register(vm, {
    id,
    dom,
    opened,
  })
  onBeforeUnmount(() => rootLayer.unregister(id))

  return {
    selecting: rootLayer.selecting,
    dom,
    opened,
    isActive,
  }
}

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
  useId,
} from 'vue'
import { addDragListener, findChildrenWithProvide } from '../utils'

export interface LayerItem {
  id: string
  node: Ref<Node>
  dom: Ref<HTMLElement | undefined>
  opened: Ref<boolean>
}

export interface LayerProvide {
  selecting: Ref<boolean>
  openedItems: Map<string, Ref<boolean>>
  register: (
    vm: ComponentInternalInstance,
    item: LayerItem,
  ) => void
  unregister: (id: string) => void
  onMousedown?: (event: MouseEvent, id: string) => void
  dragging: Ref<boolean>
  droppingItemId: Ref<string | undefined>
}

export const LayerKey: InjectionKey<LayerProvide> = Symbol.for('layer')
export const LayerItemKey: InjectionKey<{ id: string }> = Symbol.for('layer-item')

export function createLayer() {
  const registered = ref<string[]>([])
  const nodeItems = new Map<string, Ref<Node>>()
  const openedItems = reactive(new Map<string, Ref<boolean>>())
  const domItems = reactive(new Map<string, Ref<HTMLElement | undefined>>())
  const rootVm = getCurrentInstance()!
  const selecting = ref(false)
  const dragging = ref(false)
  const droppingItemId = ref<string>()

  function getIdByNode(node: Node): string | undefined {
    let id: string | undefined
    nodeItems.forEach((_node, _id) => {
      if (node.equal(_node.value)) {
        id = _id
      }
    })
    return id
  }

  provide(LayerKey, {
    selecting,
    openedItems,
    dragging,
    droppingItemId,
    register: (vm, item) => {
      const {
        id,
        dom,
        opened,
        node,
      } = item
      nodeItems.set(id, node)
      openedItems.set(id, opened)
      domItems.set(id, dom)
      registered.value.push(id)
      const instances = findChildrenWithProvide(LayerItemKey, rootVm?.vnode)
      const instanceIndex = instances.indexOf(vm)
      if (instanceIndex > -1) {
        registered.value.splice(instanceIndex, 0, id)
      }
      else {
        registered.value.push(id)
      }
    },
    unregister: (id) => {
      nodeItems.delete(id)
      openedItems.delete(id)
      domItems.delete(id)
      registered.value = registered.value.filter(v => v !== id)
    },
    onMousedown: (e, id) => {
      const from = nodeItems.get(id)?.value

      addDragListener(e, {
        threshold: 10,
        start: () => {
          dragging.value = true
        },
        move: ({ event }) => {
          const layer = event.composedPath().find((target) => {
            return target instanceof HTMLElement
              && target.classList.contains('m-layer')
          })
          const id = (layer as HTMLElement)?.dataset?.id
          if (id) {
            droppingItemId.value = id
          }
        },
        end: () => {
          if (droppingItemId.value) {
            const to = nodeItems.get(droppingItemId.value)?.value

            if (
              to
              && from
              && !from.equal(to)
            ) {
              let toIndex = to.getIndex() + 1
              if (
                to.parent
                && from.parent
                && to.parent.equal(from.parent)
              ) {
                toIndex--
              }
              to.parent?.moveChild(
                from,
                toIndex,
              )
            }
          }
          dragging.value = false
          droppingItemId.value = undefined
          dragging.value = false
        },
      })
    },
  })

  return {
    selecting,
    openedItems,
    domItems,
    getIdByNode,
  }
}

export function useLayerItem(options: Omit<LayerItem, 'id'>) {
  const root = inject(LayerKey)

  if (!root)
    throw new Error('[mce] Could not find injected layer root')

  const id = `layer-item-${useId()}`

  const item = {
    id,
    ...options,
  }

  const vm = getCurrentInstance()!

  provide(LayerItemKey, { id })

  root.register(vm, item)

  onBeforeUnmount(() => root.unregister(id))

  return {
    ...root,
    id,
    dropping: computed(() => root.droppingItemId.value === id),
    onMousedown: (e: MouseEvent) => root.onMousedown?.(e, id),
  }
}

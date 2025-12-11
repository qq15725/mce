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
import { findChildrenWithProvide } from '../utils'

export interface LayerItem {
  id: string
  node: Ref<Node>
  dom: Ref<HTMLElement | undefined>
  opened: Ref<boolean>
}

export interface LayerProvide {
  selecting: Ref<boolean>
  sortedSelection: Ref<Node[]>
  register: (
    vm: ComponentInternalInstance,
    item: LayerItem,
  ) => void
  unregister: (id: string) => void
  onMousedown?: (event: MouseEvent, id: string) => void
  dragging: Ref<boolean>
  droppingItemId: Ref<string | undefined>
}

export const MceLayerKey: InjectionKey<LayerProvide> = Symbol.for('mce:layer')
export const MceLayerItemKey: InjectionKey<{ id: string }> = Symbol.for('mce:layer-item')

export function createLayer(options: Pick<LayerProvide, 'sortedSelection'>) {
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

  provide(MceLayerKey, {
    ...options,
    selecting,
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
      nodeItems.delete(id)
      openedItems.delete(id)
      domItems.delete(id)
      registered.value = registered.value.filter(v => v !== id)
    },
    onMousedown: (e, id) => {
      const start = { x: e.clientX, y: e.clientY }

      function onMove(e: MouseEvent) {
        const current = { x: e.clientX, y: e.clientY }

        if (
          !dragging.value
          && (
            Math.abs(current.x - start.x) >= 3
            || Math.abs(current.y - start.y) >= 3
          )
        ) {
          dragging.value = true
        }

        if (dragging.value) {
          const targets = e.composedPath()
          const layer = targets.find((target) => {
            return target instanceof HTMLElement
              && target.classList.contains('mce-layer')
          })
          const id = (layer as HTMLElement)?.dataset?.id
          if (id) {
            droppingItemId.value = id
          }
        }
      }

      function onUp() {
        if (droppingItemId.value) {
          const from = nodeItems.get(id)?.value
          const to = nodeItems.get(droppingItemId.value)?.value

          if (to && from && !from.equal(to)) {
            from.parent?.removeChild(from)
            to.parent?.moveChild(
              from,
              to.getIndex() + 1,
            )
          }
        }
        dragging.value = false
        droppingItemId.value = undefined
        document.removeEventListener('mousemove', onMove)
        document.removeEventListener('mouseup', onUp)
      }

      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', onUp)
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
  const root = inject(MceLayerKey)

  if (!root)
    throw new Error('[mce] Could not find injected layer root')

  const id = `layer-item-${useId()}`

  const item = {
    id,
    ...options,
  }

  const vm = getCurrentInstance()!

  provide(MceLayerItemKey, { id })

  root.register(vm, item)

  onBeforeUnmount(() => root.unregister(id))

  return {
    ...root,
    id,
    dropping: computed(() => root.droppingItemId.value === id),
    onMousedown: (e: MouseEvent) => root.onMousedown?.(e, id),
  }
}

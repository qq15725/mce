import type { AlignedPlacement, Side } from '@floating-ui/vue'
import type { ComputedRef, InjectionKey, PropType } from 'vue'
import { computed, getCurrentInstance, inject, onScopeDispose, provide, ref } from 'vue'
import { propsFactory } from '../utils/propsFactory'

export interface OverlayOptions {
  attach?: ComputedRef<string | boolean | Element | null | undefined>
}

export interface MceOverlayItem {
  index: ComputedRef<number>
  attach?: OverlayOptions['attach']
}

export interface MceOverlayProvide {
  register: (id: number) => MceOverlayItem
  unregister: (id: number) => void
}

export const MceOverlaySymbol: InjectionKey<MceOverlayProvide> = Symbol.for('MceOverlaySymbol')

export const makeMceOverlayProps = propsFactory({
  location: String as PropType<Side | AlignedPlacement>,
  offset: Number,
  target: Object as PropType<any>,
  attach: {
    type: [String, Boolean, Object] as PropType<string | boolean | Element | null | undefined>,
    default: undefined,
  },
}, 'makeMceOverlayProps')

let globalOverlayRoot: MceOverlayProvide | undefined
function getGlobalOverlayRoot() {
  return globalOverlayRoot ??= createOverlayRoot()
}

function createOverlayRoot(options: OverlayOptions = {}) {
  const overlays = ref<number[]>([])

  return {
    register: (id: number) => {
      const index = overlays.value.push(id)
      return {
        index: computed(() => index),
        attach: options.attach,
      }
    },
    unregister: (id: number) => overlays.value.splice(overlays.value.indexOf(id), 1),
  }
}

export function provideOverlay(options: OverlayOptions = {}) {
  let root = inject(MceOverlaySymbol, null)
  if (!root) {
    root = createOverlayRoot(options)
    provide(MceOverlaySymbol, root)
  }
  return root
}

export function useOverlay(): MceOverlayItem {
  const root = inject(MceOverlaySymbol, getGlobalOverlayRoot())
  const vm = getCurrentInstance()
  if (!vm) {
    throw new Error('Failed to useOverlayRoot, vm is null')
  }
  const item = root.register(vm.uid)
  onScopeDispose(() => {
    root.unregister(vm.uid)
  })
  return item
}

import type { InjectionKey } from 'vue'

export interface MceMenuProvide {
  register: () => void
  unregister: () => void
  closeParents: (e?: MouseEvent) => void
}

export const MceMenuSymbol: InjectionKey<MceMenuProvide> = Symbol.for('MceMenuSymbol')

import type { Reactive } from 'vue'
import { reactive } from 'vue'

export interface MapRegistry<T> {
  map: Reactive<Map<string, T>>
  register: (value: T | T[]) => void
  unregister: (key: string) => void
}

/**
 * 创建一个以字符串为键的响应式注册表。
 * 统一「reactive(Map) + 数组展平 register + delete unregister」样板。
 */
export function createMapRegistry<T>(keyFn: (item: T) => string): MapRegistry<T> {
  // 用未参数化的 Map 承载，避免 reactive 对值类型做 UnwrapRef，再在边界处转回强类型
  const map = reactive(new Map()) as Reactive<Map<string, T>>

  const register = (value: T | T[]): void => {
    if (Array.isArray(value)) {
      value.forEach(register)
    }
    else {
      (map as Map<string, T>).set(keyFn(value), value)
    }
  }

  const unregister = (key: string): void => {
    map.delete(key)
  }

  return { map, register, unregister }
}

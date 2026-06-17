import type { Reactivity } from './reactivity'
import { isReactive, markRaw, reactive, toRaw } from 'vue'

/**
 * Vue 响应式适配器：把 Vue 的 reactive/markRaw/isReactive/toRaw 适配为 {@link Reactivity} 接口。
 *
 * 这是「Vue 绑定」模块——唯一 import vue 的 CRDT 文件。核心 {@link YDoc} 不依赖它，
 * 由上层（scene/Doc）显式注入，从而保持数据层框架无关、可在 headless 下测试。
 */
export const vueReactivity: Reactivity = {
  reactive: target => reactive(target as object) as typeof target,
  isReactive,
  markRaw,
  toRaw,
}

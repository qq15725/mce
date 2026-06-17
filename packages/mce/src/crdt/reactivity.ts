/**
 * 响应式适配器：把 CRDT 核心层（YDoc）与具体的响应式框架（Vue）解耦。
 *
 * 动机：原 `YDoc` 直接 `import { reactive, markRaw, isReactive } from 'vue'`，使数据层硬绑 Vue，
 * 既无法在非 Vue / 纯 Node 环境下测试，也让「Yjs 数据」与「视图响应式」两个关注点纠缠在一起。
 * 抽成接口后：
 * - CRDT 层只依赖 {@link Reactivity} 接口，不 import vue；
 * - 运行时由上层（scene/Doc）注入真实的 Vue 适配器 —— 行为与原来完全一致；
 * - 测试 / headless 场景注入 {@link rawReactivity} —— 走纯数据路径，零响应式开销。
 */
export interface Reactivity {
  /** 包装为响应式代理（Vue: reactive）。raw 模式下原样返回。 */
  reactive: <T extends object>(target: T) => T
  /** 判断是否已是响应式代理。raw 模式下恒为 true，使「按需包装」逻辑跳过包装。 */
  isReactive: (value: unknown) => boolean
  /** 标记对象不被响应式系统代理（Vue: markRaw）。raw 模式下原样返回。 */
  markRaw: <T extends object>(value: T) => T
  /** 取回响应式代理背后的原始对象（Vue: toRaw）。raw 模式下原样返回。 */
  toRaw: <T>(value: T) => T
}

/**
 * 无响应式实现：纯数据层，不做任何包装。
 * - `isReactive` 恒 true，让 `if (!isReactive(node)) wrap(node)` 这类逻辑直接跳过；
 * - 其余均为恒等函数。
 * 用于单元测试与非 Vue 宿主环境。
 */
export const rawReactivity: Reactivity = {
  reactive: target => target,
  isReactive: () => true,
  markRaw: value => value,
  toRaw: value => value,
}

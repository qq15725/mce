import { cloneDeep, get, isPlainObject, merge, set } from 'lodash-es'

/**
 * 组件 / 符号 / 实例系统的纯逻辑层（参考 components：master + instances + overrides）。
 *
 * - master 定义：一棵节点子树的 JSON 快照（node.toJSON()）。
 * - instance：从 master 克隆出的子树，记录 componentId 与一组路径级 override。
 * - 传播：master 更新后，实例 = 重新实例化(master) 再叠加各自 override。
 *
 * 纯函数、无编辑器耦合，可独立单测；插件层负责存储、克隆入画布与传播。
 */

export interface ComponentDef {
  id: string
  name: string
  /** master 节点 JSON（来自 node.toJSON()）。 */
  node: any
}

/** 实例覆盖：节点 JSON 内的路径（lodash 路径，如 'style.fill'、'children.0.text.content'）→ 值。 */
export type InstanceOverrides = Record<string, any>

/**
 * 递归剥离子树里的 id，使实例化后每个节点都获得新 id。
 * （addElement 的 regenId 只清顶层 id，子节点 id 会冲突。）
 */
export function stripNodeIds<T>(node: T): T {
  const clone = cloneDeep(node)
  const walk = (n: any): void => {
    if (n && typeof n === 'object') {
      delete n.id
      if (Array.isArray(n.children)) {
        n.children.forEach(walk)
      }
    }
  }
  walk(clone)
  return clone
}

/**
 * 按 path → value 应用一组覆盖。返回新对象，不改输入。
 * 值为普通对象时与原值**深合并**（便于只覆盖 `style` 的部分字段而不丢其余）；
 * 基本类型 / 数组则整值替换。
 */
export function applyOverrides<T>(node: T, overrides: InstanceOverrides = {}): T {
  const clone = cloneDeep(node)
  for (const [path, value] of Object.entries(overrides)) {
    if (isPlainObject(value)) {
      const existing = get(clone, path)
      set(clone as any, path, isPlainObject(existing) ? merge({}, existing, value) : cloneDeep(value))
    }
    else {
      set(clone as any, path, value)
    }
  }
  return clone
}

/**
 * 从 master 定义实例化一份节点 JSON：先剥 id（保证新实例独立），再叠加 override。
 * 返回的 JSON 交给 addElement(regenId) 落入画布。
 */
export function instantiateComponent(def: ComponentDef, overrides: InstanceOverrides = {}): any {
  return applyOverrides(stripNodeIds(def.node), overrides)
}

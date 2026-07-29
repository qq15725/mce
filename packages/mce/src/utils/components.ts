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
 * 递归剥离子树里的 id，使落入画布后每个节点都获得新 id（Node.parse 见缺 id 会自动发新的）。
 *
 * 组件实例化与 `addElement` 的 `regenId` 共用这一份 —— 只剥顶层的话，子节点会带着源文档的 id
 * 进来，与文档里已存在的同 id 节点撞车（复制整块画板到另一个文件里粘贴两次即现：先粘的那块被
 * 搬空、后粘的那块出现两份）。
 *
 * **结构共享**：只重建「节点对象自身 + children 数组」，style/text/shape 等叶子对象与入参共享
 * 引用，不做深拷贝——它是粘贴/复制的必经之路，整块画板深拷两遍纯属浪费。因此本函数只保证
 * 「不修改入参」；调用方若要就地改结果（如叠加 override），自己先 cloneDeep。
 */
export function stripNodeIds<T>(node: T): T {
  if (Array.isArray(node)) {
    return node.map(item => stripNodeIds(item)) as T
  }
  if (!node || typeof node !== 'object') {
    return node
  }
  const { id: _dropped, ...rest } = node as any
  if (Array.isArray(rest.children)) {
    rest.children = rest.children.map((child: any) => stripNodeIds(child))
  }
  return rest as T
}

/**
 * 按 path → value 应用一组覆盖。返回新对象，不改输入。
 * 值为普通对象时与原值**深合并**（便于只覆盖 `style` 的部分字段而不丢其余）；
 * 基本类型 / 数组则整值替换。
 */
/** 在已克隆好的子树上原地叠加覆盖（内部用，避免重复深拷贝）。 */
function applyOverridesInPlace<T>(clone: T, overrides: InstanceOverrides): T {
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

export function applyOverrides<T>(node: T, overrides: InstanceOverrides = {}): T {
  return applyOverridesInPlace(cloneDeep(node), overrides)
}

/**
 * 从 master 定义实例化一份节点 JSON：先剥 id（保证新实例独立），再叠加 override。
 * 返回的 JSON 交给 addElement(regenId) 落入画布。
 */
export function instantiateComponent(def: ComponentDef, overrides: InstanceOverrides = {}): any {
  // override 是就地写（applyOverridesInPlace 会改到嵌套对象），而 stripNodeIds 只做结构共享，
  // 故这里自己深拷一份再剥 id —— 整条链上只此一次深拷贝，master 不会被实例的 override 改脏。
  return applyOverridesInPlace(stripNodeIds(cloneDeep(def.node)), overrides)
}

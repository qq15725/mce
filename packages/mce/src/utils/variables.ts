/**
 * 设计令牌 / 变量系统的纯逻辑层（参考 variables：collections + modes）。
 *
 * 一个 collection 含多个 mode（如「亮 / 暗」「手机 / 桌面」）；每个变量按 mode 存值，
 * 值可以是字面量，也可以是指向另一变量的别名（alias）。解析在变量所属 collection 的
 * mode 内进行，支持跨 collection 别名与环检测。纯函数、无编辑器耦合，可独立单测；
 * 插件层负责把状态存进文档并把解析结果应用到画布。
 */

export type VariableType = 'color' | 'number' | 'string' | 'boolean'

export interface VariableAlias {
  type: 'alias'
  id: string
}

export type VariableLiteral = string | number | boolean
export type VariableValue = VariableLiteral | VariableAlias

export interface VariableMode {
  id: string
  name: string
}

export interface Variable {
  id: string
  name: string
  type: VariableType
  /** 按 mode id 存值。 */
  valuesByMode: Record<string, VariableValue>
}

export interface VariableCollection {
  id: string
  name: string
  modes: VariableMode[]
  defaultModeId: string
  variables: Variable[]
}

export interface VariablesState {
  collections: VariableCollection[]
}

export function createVariablesState(): VariablesState {
  return { collections: [] }
}

export function isVariableAlias(v: unknown): v is VariableAlias {
  return !!v && typeof v === 'object' && (v as any).type === 'alias' && typeof (v as any).id === 'string'
}

function findVariable(
  state: VariablesState,
  variableId: string,
): { collection: VariableCollection, variable: Variable } | undefined {
  for (const collection of state.collections) {
    const variable = collection.variables.find(v => v.id === variableId)
    if (variable) {
      return { collection, variable }
    }
  }
  return undefined
}

/** 变量所属的 collection（用于查它该用哪个 active mode）。 */
export function getVariableCollection(
  state: VariablesState,
  variableId: string,
): VariableCollection | undefined {
  return findVariable(state, variableId)?.collection
}

/**
 * 把变量解析为字面量值。modeId 在变量所属 collection 内解释（不存在则回退该 collection
 * 的 defaultMode）；别名递归解析并做环检测，遇环 / 缺值返回 undefined。
 */
export function resolveVariable(
  state: VariablesState,
  variableId: string,
  modeId?: string,
  seen: Set<string> = new Set(),
): VariableLiteral | undefined {
  if (seen.has(variableId)) {
    return undefined
  }
  seen.add(variableId)

  const found = findVariable(state, variableId)
  if (!found) {
    return undefined
  }
  const { collection, variable } = found

  const effectiveModeId = modeId && collection.modes.some(m => m.id === modeId)
    ? modeId
    : collection.defaultModeId

  const value = variable.valuesByMode[effectiveModeId] ?? variable.valuesByMode[collection.defaultModeId]
  if (value === undefined) {
    return undefined
  }
  if (isVariableAlias(value)) {
    return resolveVariable(state, value.id, modeId, seen)
  }
  return value
}

// ── 不可变 CRUD（插件按 mode 切换时整体替换文档里的状态以触发 CRDT 同步）──

export function addCollection(
  state: VariablesState,
  input: { id: string, name: string, mode: VariableMode },
): VariablesState {
  const collection: VariableCollection = {
    id: input.id,
    name: input.name,
    modes: [input.mode],
    defaultModeId: input.mode.id,
    variables: [],
  }
  return { collections: [...state.collections, collection] }
}

export function addMode(
  state: VariablesState,
  collectionId: string,
  mode: VariableMode,
): VariablesState {
  return mapCollection(state, collectionId, c => ({ ...c, modes: [...c.modes, mode] }))
}

export function addVariable(
  state: VariablesState,
  collectionId: string,
  variable: { id: string, name: string, type: VariableType, value: VariableValue },
): VariablesState {
  return mapCollection(state, collectionId, (c) => {
    const next: Variable = {
      id: variable.id,
      name: variable.name,
      type: variable.type,
      // 新变量默认在所有 mode 取同一初值，避免缺 mode 解析落空。
      valuesByMode: Object.fromEntries(c.modes.map(m => [m.id, variable.value])),
    }
    return { ...c, variables: [...c.variables, next] }
  })
}

export function setVariableValue(
  state: VariablesState,
  variableId: string,
  modeId: string,
  value: VariableValue,
): VariablesState {
  return {
    collections: state.collections.map(c => ({
      ...c,
      variables: c.variables.map(v =>
        v.id === variableId
          ? { ...v, valuesByMode: { ...v.valuesByMode, [modeId]: value } }
          : v,
      ),
    })),
  }
}

function mapCollection(
  state: VariablesState,
  collectionId: string,
  fn: (c: VariableCollection) => VariableCollection,
): VariablesState {
  return {
    collections: state.collections.map(c => (c.id === collectionId ? fn(c) : c)),
  }
}

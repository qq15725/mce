import type { Element2D, Node } from 'modern-canvas'
import type { VariablesState, VariableType, VariableValue } from '../utils'
import { set } from 'lodash-es'
import { idGenerator } from 'modern-idoc'
import { definePlugin } from '../plugin'
import {
  addCollection,
  addMode,
  addVariable as addVariableToState,
  createVariablesState,
  getVariableCollection,
  resolveVariable,
  setVariableValue as setVariableValueInState,
} from '../utils'

declare global {
  namespace Mce {
    /** 节点属性路径（如 'fill.color'、'style.opacity'）→ 变量 id 的绑定，存于节点 meta.variableBindings。 */
    type VariableBindings = Record<string, string>

    interface Commands {
      createVariableCollection: (name: string, modeName?: string) => string
      createVariableMode: (collectionId: string, name: string) => string
      createVariable: (collectionId: string, variable: { name: string, type: VariableType, value: VariableValue }) => string
      setVariableValue: (variableId: string, modeId: string, value: VariableValue) => void
      /** 切换某 collection 的当前 mode（如亮 / 暗），并把绑定重新解析到画布。 */
      setActiveVariableMode: (collectionId: string, modeId: string) => void
      bindVariable: (styleKey: string, variableId: string, node?: Element2D) => void
      unbindVariable: (styleKey: string, node?: Element2D) => void
      getVariablesState: () => VariablesState
      /** 把所有节点上的变量绑定按当前 mode 解析并写入样式。 */
      resolveVariables: () => void
    }
  }
}

export default definePlugin((editor) => {
  const {
    root,
    isElement,
    elementSelection,
  } = editor

  function rootMeta(): Record<string, any> | undefined {
    return root.value?.meta as any
  }

  // 注意：Meta 的属性 getter / getProperty 不支持任意自定义键，自定义键只能经 toJSON 读回；
  // 写入用属性赋值（会存进底层 Y.Map 并随 CRDT 同步）。
  function readMeta<T>(key: string, fallback: T): T {
    return rootMeta()?.toJSON?.()?.[key] ?? fallback
  }

  function getState(): VariablesState {
    return readMeta<VariablesState>('variables', createVariablesState())
  }

  function setState(state: VariablesState): void {
    const meta = rootMeta()
    if (meta) {
      meta.variables = state
    }
  }

  function getActiveModes(): Record<string, string> {
    return readMeta<Record<string, string>>('variableActiveModes', {})
  }

  function setActiveModes(modes: Record<string, string>): void {
    const meta = rootMeta()
    if (meta) {
      meta.variableActiveModes = modes
    }
  }

  function createVariableCollection(name: string, modeName = 'Default'): string {
    const id = idGenerator()
    const modeId = idGenerator()
    setState(addCollection(getState(), { id, name, mode: { id: modeId, name: modeName } }))
    return id
  }

  function createVariableMode(collectionId: string, name: string): string {
    const modeId = idGenerator()
    setState(addMode(getState(), collectionId, { id: modeId, name }))
    return modeId
  }

  function createVariable(
    collectionId: string,
    variable: { name: string, type: VariableType, value: VariableValue },
  ): string {
    const id = idGenerator()
    setState(addVariableToState(getState(), collectionId, { id, ...variable }))
    return id
  }

  function setVariableValue(variableId: string, modeId: string, value: VariableValue): void {
    setState(setVariableValueInState(getState(), variableId, modeId, value))
    resolveVariables()
  }

  function setActiveVariableMode(collectionId: string, modeId: string): void {
    setActiveModes({ ...getActiveModes(), [collectionId]: modeId })
    resolveVariables()
  }

  function bindVariable(styleKey: string, variableId: string, node = elementSelection.value[0]): void {
    if (!node) {
      return
    }
    const meta = node.meta as any
    meta.variableBindings = { ...(meta.variableBindings ?? {}), [styleKey]: variableId }
    resolveVariables()
  }

  function unbindVariable(styleKey: string, node = elementSelection.value[0]): void {
    if (!node) {
      return
    }
    const meta = node.meta as any
    const bindings = { ...(meta.variableBindings ?? {}) }
    delete bindings[styleKey]
    meta.variableBindings = bindings
  }

  function resolveVariables(): void {
    const state = getState()
    const activeModes = getActiveModes()
    root.value?.findOne((node: Node) => {
      const bindings = (node.meta as any)?.variableBindings as Mce.VariableBindings | undefined
      if (bindings && isElement(node)) {
        for (const [path, variableId] of Object.entries(bindings)) {
          const collection = getVariableCollection(state, variableId)
          const modeId = collection ? (activeModes[collection.id] ?? collection.defaultModeId) : undefined
          const value = resolveVariable(state, variableId, modeId)
          if (value !== undefined) {
            // path 是节点内的属性路径（如 'fill.color'、'style.opacity'）。
            set(node as Element2D, path, value)
          }
        }
      }
      return false
    })
  }

  return {
    name: 'mce:variables',
    commands: [
      { command: 'createVariableCollection', handle: createVariableCollection },
      { command: 'createVariableMode', handle: createVariableMode },
      { command: 'createVariable', handle: createVariable },
      { command: 'setVariableValue', handle: setVariableValue },
      { command: 'setActiveVariableMode', handle: setActiveVariableMode },
      { command: 'bindVariable', handle: bindVariable },
      { command: 'unbindVariable', handle: unbindVariable },
      { command: 'getVariablesState', handle: getState },
      { command: 'resolveVariables', handle: resolveVariables },
    ],
  }
})

import type { Element2D, Node } from 'modern-canvas'
import type { VariablesState, VariableType, VariableValue } from '../utils'
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
    /** 节点样式键 → 变量 id 的绑定，存于节点 meta.variableBindings。 */
    type VariableBindings = Record<string, string>

    interface Commands {
      createVariableCollection: (name: string, modeName?: string) => string
      addVariableMode: (collectionId: string, name: string) => string
      addVariable: (collectionId: string, variable: { name: string, type: VariableType, value: VariableValue }) => string
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

  function getState(): VariablesState {
    return rootMeta()?.variables ?? createVariablesState()
  }

  function setState(state: VariablesState): void {
    const meta = rootMeta()
    if (meta) {
      meta.variables = state
    }
  }

  function getActiveModes(): Record<string, string> {
    return rootMeta()?.variableActiveModes ?? {}
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

  function addVariableMode(collectionId: string, name: string): string {
    const modeId = idGenerator()
    setState(addMode(getState(), collectionId, { id: modeId, name }))
    return modeId
  }

  function addVariable(
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
        const style = (node as Element2D).style as any
        for (const [key, variableId] of Object.entries(bindings)) {
          const collection = getVariableCollection(state, variableId)
          const modeId = collection ? (activeModes[collection.id] ?? collection.defaultModeId) : undefined
          const value = resolveVariable(state, variableId, modeId)
          if (value !== undefined) {
            style[key] = value
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
      { command: 'addVariableMode', handle: addVariableMode },
      { command: 'addVariable', handle: addVariable },
      { command: 'setVariableValue', handle: setVariableValue },
      { command: 'setActiveVariableMode', handle: setActiveVariableMode },
      { command: 'bindVariable', handle: bindVariable },
      { command: 'unbindVariable', handle: unbindVariable },
      { command: 'getVariablesState', handle: getState },
      { command: 'resolveVariables', handle: resolveVariables },
    ],
  }
})

import type { Element2D, Node } from 'modern-canvas'
import type { ComponentDef, InstanceOverrides } from '../utils'
import { idGenerator } from 'modern-idoc'
import { definePlugin } from '../plugin'
import { instantiateComponent } from '../utils'

declare global {
  namespace Mce {
    interface CreateInstanceOptions {
      position?: AddElementPosition
      parent?: Node
      active?: boolean
    }

    interface Commands {
      /** 把选中（或指定）元素登记为组件 master，返回组件 id。 */
      createComponent: (node?: Element2D) => string | undefined
      /** 从组件实例化一个 instance，返回实例元素 id。 */
      createInstance: (componentId: string, options?: CreateInstanceOptions) => string | undefined
      /** 设置实例的路径级覆盖并重建该实例。 */
      setInstanceOverride: (path: string, value: any, node?: Element2D) => void
      /** 解除实例与组件的关联，变回普通元素。 */
      detachInstance: (node?: Element2D) => void
      /** 用某节点的当前内容更新组件 master，并传播到所有实例。 */
      updateComponent: (componentId: string, node?: Element2D) => void
      /** 把某组件的所有实例按 master + 各自 override 重建。 */
      syncInstancesOf: (componentId: string) => void
      getComponents: () => ComponentDef[]
    }
  }
}

export default definePlugin((editor) => {
  const {
    root,
    isElement,
    elementSelection,
    addElement,
  } = editor

  function rootMeta(): Record<string, any> | undefined {
    return root.value?.meta as any
  }

  function getComponents(): ComponentDef[] {
    return rootMeta()?.components ?? []
  }

  function setComponents(defs: ComponentDef[]): void {
    const meta = rootMeta()
    if (meta) {
      meta.components = defs
    }
  }

  function findDef(componentId: string): ComponentDef | undefined {
    return getComponents().find(d => d.id === componentId)
  }

  function createComponent(node = elementSelection.value[0]): string | undefined {
    if (!node) {
      return undefined
    }
    const id = idGenerator()
    const def: ComponentDef = { id, name: node.name || 'Component', node: node.toJSON() }
    setComponents([...getComponents(), def])
    const meta = node.meta as any
    meta.inEditorIs = 'Component'
    meta.componentId = id
    return id
  }

  function createInstance(componentId: string, options: Mce.CreateInstanceOptions = {}): string | undefined {
    const def = findDef(componentId)
    if (!def) {
      return undefined
    }
    const el = addElement(instantiateComponent(def), {
      position: options.position,
      parent: options.parent,
      active: options.active,
      regenId: true,
    })
    const meta = el.meta as any
    meta.inEditorIs = 'Instance'
    meta.componentId = componentId
    meta.overrides = {}
    return el.id
  }

  /** 用 master + 实例自身 override 重建实例的子树与顶层样式。 */
  function syncInstance(instanceNode: Element2D): void {
    const meta = instanceNode.meta as any
    const def = findDef(meta?.componentId)
    if (!def) {
      return
    }
    const overrides: InstanceOverrides = meta.overrides ?? {}
    const json = instantiateComponent(def, overrides)

    // 顶层样式 / 文本回写到实例节点本身（实例根 = master 根）。
    if (json.style) {
      Object.assign((instanceNode as any).style, json.style)
    }
    if (json.text) {
      ;(instanceNode as any).text = json.text
    }

    // 重建子树。
    ;[...instanceNode.children].forEach(child => child.remove())
    if (Array.isArray(json.children) && json.children.length) {
      addElement(json.children, { parent: instanceNode, regenId: true })
    }
  }

  function setInstanceOverride(path: string, value: any, node = elementSelection.value[0]): void {
    if (!node) {
      return
    }
    const meta = node.meta as any
    meta.overrides = { ...(meta.overrides ?? {}), [path]: value }
    syncInstance(node)
  }

  function detachInstance(node = elementSelection.value[0]): void {
    if (!node) {
      return
    }
    const meta = node.meta as any
    delete meta.inEditorIs
    delete meta.componentId
    delete meta.overrides
  }

  function eachInstanceOf(componentId: string, fn: (node: Element2D) => void): void {
    root.value?.findOne((node: Node) => {
      const meta = (node as any).meta
      if (meta?.inEditorIs === 'Instance' && meta.componentId === componentId && isElement(node)) {
        fn(node as Element2D)
      }
      return false
    })
  }

  function syncInstancesOf(componentId: string): void {
    eachInstanceOf(componentId, syncInstance)
  }

  function updateComponent(componentId: string, node = elementSelection.value[0]): void {
    const def = findDef(componentId)
    if (!def || !node) {
      return
    }
    setComponents(getComponents().map(d => (d.id === componentId ? { ...d, node: node.toJSON() } : d)))
    syncInstancesOf(componentId)
  }

  return {
    name: 'mce:components',
    commands: [
      { command: 'createComponent', handle: createComponent },
      { command: 'createInstance', handle: createInstance },
      { command: 'setInstanceOverride', handle: setInstanceOverride },
      { command: 'detachInstance', handle: detachInstance },
      { command: 'updateComponent', handle: updateComponent },
      { command: 'syncInstancesOf', handle: syncInstancesOf },
      { command: 'getComponents', handle: getComponents },
    ],
  }
})

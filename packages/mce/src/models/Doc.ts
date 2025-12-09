import type { CoreObject } from 'modern-canvas'
import type { Document, Element, NormalizedElement, PropertyAccessor } from 'modern-idoc'
import type { Transaction, YArrayEvent, YMapEvent } from 'yjs'
import type { ModelEvents } from './Model'
import { Element2D, Node } from 'modern-canvas'
import { normalizeElement, property } from 'modern-idoc'
import { markRaw, reactive } from 'vue'
import * as Y from 'yjs'
import { Model } from './Model'

interface AddNodeOptions {
  parentId?: string
  index?: number
  regenId?: boolean
}

export type YNode = Y.Map<unknown> & {
  get:
    & ((prop: 'id') => string)
    & ((prop: 'name') => string)
    & ((prop: 'parentId') => string)
    & ((prop: 'style') => Y.Map<unknown>)
    & ((prop: 'background') => Y.Map<unknown>)
    & ((prop: 'shape') => Y.Map<unknown>)
    & ((prop: 'fill') => Y.Map<unknown>)
    & ((prop: 'outline') => Y.Map<unknown>)
    & ((prop: 'text') => Y.Map<unknown>)
    & ((prop: 'foreground') => Y.Map<unknown>)
    & ((prop: 'shadow') => Y.Map<unknown>)
    & ((prop: 'meta') => Y.Map<unknown>)
    & ((prop: 'childrenIds') => Y.Array<string>)
    & (<T = unknown>(prop: string) => T)
}

export interface YNodeResult {
  id: string
  node: YNode
}

function initYElement(
  yMap: Y.Map<unknown>,
  element: Element = {},
  parentId: string | undefined,
  regenId = false,
): { normalized: NormalizedElement, yChildrenIds: Y.Array<string> } {
  const normalized = normalizeElement({
    ...element,
    id: regenId ? undefined : element.id,
    meta: {
      inCanvasIs: 'Element2D',
      ...(element?.meta ?? {}),
    },
  })

  const id = normalized.id
  const yChildrenIds = new Y.Array<string>()

  // Node
  for (const key in normalized) {
    yMap.set(key, (normalized as any)[key])
  }
  yMap.set('id', id)
  yMap.set('parentId', parentId)
  yMap.set('name', normalized.name ?? id)
  yMap.set('childrenIds', yChildrenIds)
  yMap.set('meta', new Y.Map(Object.entries(normalized.meta ?? {})))

  const inCanvasIs = normalized?.meta?.inCanvasIs

  // Element2d
  if (inCanvasIs === 'Element2D' || inCanvasIs === 'Lottie2D') {
    yMap.set('style', new Y.Map(Object.entries(normalized.style ?? {})))
    yMap.set('background', new Y.Map(Object.entries(normalized.background ?? {})))
    yMap.set('shape', new Y.Map(Object.entries(normalized.shape ?? {})))
    yMap.set('fill', new Y.Map(Object.entries(normalized.fill ?? {})))
    yMap.set('outline', new Y.Map(Object.entries(normalized.outline ?? {})))
    yMap.set('text', new Y.Map(Object.entries(normalized.text ?? {})))
    yMap.set('foreground', new Y.Map(Object.entries(normalized.foreground ?? {})))
    yMap.set('shadow', new Y.Map(Object.entries(normalized.shadow ?? {})))
  }

  return {
    normalized,
    yChildrenIds,
  }
}

export function iElementToYNodes(
  element: Element,
  parentId: string | undefined,
  regenId = false,
): YNodeResult[] {
  const results: YNodeResult[] = []
  const yNode = new Y.Map<unknown>() as YNode
  const { normalized, yChildrenIds } = initYElement(yNode, element, parentId, regenId)
  const id = normalized.id
  results.push({ id, node: yNode })
  normalized.children?.forEach((iChild) => {
    const result = iElementToYNodes(iChild, id, regenId)
    yChildrenIds.push([result[0].id])
    results.push(...result)
  })
  return results
}

export interface DocEvents extends ModelEvents {
  history: [arg0: Y.UndoManager]
}

export interface Doc {
  on: <K extends keyof DocEvents & string>(event: K, listener: (...args: DocEvents[K]) => void) => this
  once: <K extends keyof DocEvents & string>(event: K, listener: (...args: DocEvents[K]) => void) => this
  off: <K extends keyof DocEvents & string>(event: K, listener: (...args: DocEvents[K]) => void) => this
  emit: <K extends keyof DocEvents & string>(event: K, ...args: DocEvents[K]) => this
}

export class Doc extends Model {
  protected _yChildren: Y.Map<YNode>
  protected _yChildrenIds: Y.Array<string>

  @property({ default: 'doc' }) declare name: string

  readonly root = reactive(new Node()) as Node
  protected _nodeMap = new Map<string, Node>()

  get meta() { return this.root.meta }
  set meta(val) { this.root.meta = val }

  constructor(id?: string) {
    super(id)
    this._yChildren = markRaw(this._yDoc.getMap('children'))
    this._yChildrenIds = markRaw(this._yDoc.getArray('childrenIds') as Y.Array<string>)
    this._setupUndoManager([
      this._yChildren,
      this._yChildrenIds,
    ])
  }

  override setProperties(properties?: Record<string, any>): this {
    if (properties) {
      const {
        meta,
        ...restProperties
      } = properties

      if (meta) {
        this.meta = meta
      }

      super.setProperties(restProperties)
    }
    return this
  }

  override async load(initFn?: () => void | Promise<void>): Promise<this> {
    return super.load(async () => {
      await initFn?.()
      this._proxyProps(this.root, this._yProps)
      const meta = this._yProps.get('meta') as any
      if (meta) {
        this._proxyProps(this.root.meta, meta, true)
      }
      this._proxyChildren(this.root, this._yChildrenIds)
      this._yChildrenIds.forEach((id) => {
        const yNode = this._yChildren.get(id)
        if (yNode) {
          this._getOrCreateNode(yNode)
        }
      })
      this._yChildren.observe(this._onChildrenChange.bind(this) as any)
    })
  }

  protected _isSelfTransaction(transaction: Y.Transaction) {
    return !transaction.origin || transaction.origin === this._yDoc.clientID
  }

  protected _debug(..._args: any[]) {
    // console.log(..._args)
  }

  protected _onChildrenChange(
    event: Y.YMapEvent<Y.Map<unknown>>,
    transaction: Y.Transaction,
  ) {
    if (this._isSelfTransaction(transaction)) {
      return
    }

    this._debug('_onChildrenChange', event)

    const { keysChanged, changes } = event

    keysChanged.forEach((key) => {
      const change = changes.keys.get(key)
      const yNode = this._yChildren.get(key)
      switch (change?.action) {
        case 'add':
          if (yNode) {
            this._getOrCreateNode(yNode)
          }
          break
        case 'delete':
          this._nodeMap.get(key)?.remove()
          this._nodeMap.delete(key)
          break
      }
    })
  }

  override reset(): this {
    super.reset()
    this._yChildren.clear()
    this._yChildrenIds.delete(0, this._yChildrenIds.length)
    this._nodeMap.clear()
    this.undoManager.clear()
    this.indexeddb?.clearData()
    return this
  }

  protected _addNode(node: Element, options: AddNodeOptions = {}): Node {
    const { parentId, index, regenId } = options
    const yNodes = iElementToYNodes(node, parentId, regenId)
    yNodes.forEach(result => this._yChildren.set(result.id, result.node))
    const _nodeMap = yNodes.map(result => this._getOrCreateNode(result.node))
    const first = _nodeMap[0]
    let parent
    let childrenIds
    if (parentId && parentId !== this.root.id) {
      parent = this._nodeMap.get(parentId)
      childrenIds = this._yChildren.get(parentId)?.get('childrenIds')
    }
    else {
      parent = this.root
      childrenIds = this._yChildrenIds
    }
    if (parent && childrenIds) {
      if (index === undefined) {
        childrenIds.push([first.id])
        parent.appendChild(first)
      }
      else {
        childrenIds.insert(index, [first.id])
        parent.moveChild(first, index)
      }
    }
    return first
  }

  addNode(node: Element, options?: AddNodeOptions): Node {
    return this.transact(() => this._addNode(node, options))
  }

  addNodes(nodes: Element[], options?: AddNodeOptions): Node[] {
    return this.transact(() => nodes.map(element => this._addNode(element, options)))
  }

  set(source: Document): this {
    const { children = [], meta = {}, ...props } = source
    this.reset()
    this.addNodes(children)
    this.setProperties(props)
    this._yProps.clear()
    for (const key in props) {
      this._yProps.set(key, (props as any)[key])
    }
    this._yProps.set('meta', new Y.Map(Object.entries(meta)))
    return this
  }

  protected _deleteNode(id: string): void {
    const node = this._nodeMap.get(id)
    const yNode = this._yChildren.get(id)
    if (!yNode || !node) {
      return
    }
    const parentId = yNode.get('parentId')
    const parentChildrenIds = parentId
      ? this._yChildren.get(parentId)?.get('childrenIds')
      : this._yChildrenIds
    if (parentChildrenIds) {
      const index = parentChildrenIds.toJSON().indexOf(id)
      if (index > -1) {
        parentChildrenIds.delete(index)
      }
    }
    yNode.get('childrenIds').forEach(id => this._deleteNode(id))
    node.remove()
  }

  deleteNode(id: string): void {
    this.transact(() => this._deleteNode(id))
  }

  getNode<T extends Node = Node>(id: string): T | undefined {
    return this._nodeMap.get(id) as T
  }

  moveNode(id: string, toIndex: number): void {
    const node = this._nodeMap.get(id)
    if (!node) {
      return
    }
    const parent = node.parent
    const childrenIds = parent?.id
      ? this._yChildren.get(parent.id)?.get('childrenIds')
      : this._yChildrenIds
    if (!childrenIds) {
      return
    }
    const fromIndex = childrenIds.toJSON().indexOf(id)
    childrenIds.delete(fromIndex, 1)
    childrenIds.insert(toIndex, [id])
    if (parent && !parent.equal(this.root)) {
      parent.moveChild(node, toIndex)
    }
    else {
      this.root.moveChild(node, toIndex)
    }
  }

  protected _proxyProps(obj: CoreObject, yMap: Y.Map<any>, isMeta = false): void {
    const accessor: PropertyAccessor = {
      getProperty: key => yMap.doc ? yMap.get(key) : undefined,
      setProperty: (key, value) => {
        if (this._transacting === false) {
          return
        }
        this.transact(() => yMap.set(key, value))
      },
    }

    if (isMeta) {
      ;(obj as any)._propertyAccessor = undefined
      const oldValues: Record<string, any> = {}
      yMap.forEach((_value, key) => {
        oldValues[key] = obj.getProperty(key)
      })
      ;(obj as any)._propertyAccessor = markRaw(accessor)
      yMap.forEach((_value, key) => {
        const newValue = obj.getProperty(key)
        const oldValue = oldValues[key]
        if (newValue !== undefined && !Object.is(newValue, oldValue)) {
          obj.setProperty(key, newValue)
          obj.requestUpdate(key, newValue, oldValue)
        }
      })
    }

    obj.setPropertyAccessor(accessor)

    const observeFn = (event: YMapEvent<any>, transaction: Transaction): void => {
      if (this._isSelfTransaction(transaction)) {
        return
      }

      this._debug('_proxyProps', event, obj)

      this.transact(() => {
        const { keysChanged, changes } = event
        keysChanged.forEach((key) => {
          const change = changes.keys.get(key)
          const oldValue = change?.oldValue
          switch (change?.action) {
            case 'add':
            case 'update':
              // for vue reactive
              this.undoManager.stopCapturing()
              ;(obj as any)[key] = yMap.get(key)
              obj.requestUpdate(key, yMap.get(key), oldValue)
              break
            case 'delete':
              // for vue reactive
              this.undoManager.stopCapturing()
              ;(obj as any)[key] = undefined
              obj.requestUpdate(key, (obj as any)[key], oldValue)
              break
          }
        })
      }, false)
    }
    ;(obj as any)._yMap = markRaw(yMap)
    ;(obj as any)._yMapObserveFn && yMap.unobserve((obj as any)._yMapObserveFn)
    ;(obj as any)._yMapObserveFn = markRaw(observeFn)
    yMap.observe(observeFn)
  }

  protected _proxyChildren(node: Node, childrenIds: Y.Array<string>): void {
    childrenIds.forEach((id) => {
      const child = this._yChildren.get(id)
      if (child) {
        node.appendChild(this._getOrCreateNode(child))
      }
    })

    const observeFn = (event: YArrayEvent<any>, transaction: Transaction): void => {
      if (this._isSelfTransaction(transaction)) {
        return
      }

      this._debug('_proxyChildren', event, node)

      const children = node.children
      let retain = 0
      event.changes.delta.forEach((action) => {
        if (action.retain !== undefined) {
          retain += action.retain
        }
        if (action.delete) {
          for (let i = retain; i < retain + action.delete; i++) {
            children[i]?.remove()
          }
        }
        if (action.insert) {
          const ids = Array.isArray(action.insert) ? action.insert : [action.insert]
          ids.forEach((id, index) => {
            let child = this._nodeMap.get(id)
            const cb = (child: Node): void => {
              node.moveChild(child, retain + index)
            }
            if (child) {
              cb(child)
            }
            else {
              setTimeout(() => {
                child = this._nodeMap.get(id)
                child && cb(child)
              }, 0)
            }
          })
          retain += ids.length
        }
      })
    }
    ;(node as any)._childrenIds = markRaw(childrenIds)
    ;(node as any)._childrenIdsObserveFn && childrenIds.unobserve((node as any)._childrenIdsObserveFn)
    ;(node as any)._childrenIdsObserveFn = markRaw(observeFn)
    childrenIds.observe(observeFn)
  }

  protected _proxyNode(node: Node, yEle: YNode): void {
    this._proxyProps(node, yEle)

    const meta = yEle.get('meta')
    if (meta) {
      this._proxyProps(node.meta, meta, true)
    }

    if (node instanceof Element2D) {
      ;[
        'style',
        'background',
        'shape',
        'fill',
        'outline',
        'text',
        'foreground',
        'shadow',
      ].forEach((key) => {
        const yMap = yEle.get(key) as Y.Map<any> | undefined
        if (yMap) {
          this._proxyProps((node as any)[key], yMap)
        }
      })
      ;(node as any)._text = markRaw((node as any)._text)
      node.text.update()
      node.requestRender()
    }

    this._proxyChildren(node, yEle.get('childrenIds'))
  }

  protected _getOrCreateNode(yNode: YNode): Node {
    const id = yNode.get('id')
    let node = this._nodeMap.get(id)
    if (!node) {
      this.undoManager.addToScope(yNode)
      node = reactive(
        Node.parse({
          meta: {
            inCanvasIs: yNode.get('meta')?.get('inCanvasIs') as string | undefined,
          },
        }),
      ) as Node
      this._proxyNode(node, yNode)
      this._nodeMap.set(id, node)
    }
    return node
  }

  toJSON(): Record<string, any> {
    return {
      ...super.toJSON(),
      children: this._yChildren.toJSON(),
    }
  }
}

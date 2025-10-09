import type { CoreObject } from 'modern-canvas'
import type { Document, Element, NormalizedElement } from 'modern-idoc'
import type { Transaction, YArrayEvent, YMapEvent } from 'yjs'
import type { Editor } from '../editor'
import type { ModelEvents } from './Model'
import { Element2D, Node } from 'modern-canvas'
import { normalizeElement } from 'modern-idoc'
import { markRaw, nextTick, reactive } from 'vue'
import * as Y from 'yjs'
import { IndexeddbProvider } from '../indexeddb'
import { Model } from './Model'

interface AddElementOptions {
  parentId?: string
  index?: number
  regenerateId?: boolean
}

export interface DocMeta {
  [key: string]: any
  workspaceId: string
  createdAt: number
  updatedAt: number
}

export type DocPropsYMap = Y.Map<unknown> & {
  get:
    & ((prop: 'id') => string)
    & ((prop: 'name') => string)
    & ((prop: 'meta') => DocMeta)
    & (<T = unknown>(prop: string) => T)
}

export type ElementYMap = Y.Map<unknown> & {
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
    & ((prop: 'meta') => Record<string, any>)
    & ((prop: 'childrenIds') => Y.Array<string>)
    & (<T = unknown>(prop: string) => T)
}

export interface YElementResult {
  id: string
  element: ElementYMap
}

function initYElement(
  yMap: Y.Map<unknown>,
  element: Element = {},
  parentId: string | undefined,
  regenerateId = false,
): { normalized: NormalizedElement, yChildrenIds: Y.Array<string> } {
  const normalized = normalizeElement({
    ...element,
    id: regenerateId ? undefined : element.id,
    meta: {
      inCanvasIs: 'Element2D',
      ...(element?.meta ?? {}),
    },
  })
  const id = normalized.id
  const yChildrenIds = new Y.Array<string>()
  for (const key in normalized) {
    yMap.set(key, (normalized as any)[key])
  }

  // Node
  yMap.set('id', id)
  yMap.set('parentId', parentId)
  yMap.set('name', normalized.name ?? id)
  yMap.set('childrenIds', yChildrenIds)
  yMap.set('meta', normalized.meta ?? {})

  // Element2d
  if (normalized?.meta?.inCanvasIs === 'Element2D') {
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

export function iElementToYElements(
  element: Element,
  parentId: string | undefined,
  regenerateId = false,
): YElementResult[] {
  const results: YElementResult[] = []
  const yElement = new Y.Map<unknown>() as ElementYMap
  const { normalized, yChildrenIds } = initYElement(yElement, element, parentId, regenerateId)
  const id = normalized.id
  results.push({ id, element: yElement })
  normalized.children?.forEach((iChild) => {
    const result = iElementToYElements(iChild, id, regenerateId)
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
  readonly props: DocPropsYMap
  readonly children: Y.Map<ElementYMap>
  readonly childrenIds: Y.Array<string>

  readonly root = reactive(new Node({ name: 'doc' })) as Node
  nodeMap = new Map<string, Node>()
  protected _ready = false

  declare undoManager: Y.UndoManager
  indexeddb?: IndexeddbProvider

  constructor(
    id: string,
    public editor: Editor,
  ) {
    super(id)
    this.props = markRaw(this.doc.getMap('props') as DocPropsYMap)
    this.children = markRaw(this.doc.getMap('children'))
    this.childrenIds = markRaw(this.doc.getArray('childrenIds') as Y.Array<string>)
    this._setupUndoManager()
  }

  protected _setupUndoManager(): void {
    const um = markRaw(new Y.UndoManager([
      this.props,
      this.children,
      this.childrenIds,
    ], {
      trackedOrigins: new Set([this.doc.clientID]),
    }))
    um.trackedOrigins.add(um)
    const onHistory = (): void => {
      this.emit('history', um)
    }
    um.on('stack-item-added', onHistory)
    um.on('stack-item-updated', onHistory)
    um.on('stack-item-popped', onHistory)
    um.on('stack-cleared', onHistory)
    this.undoManager = um
  }

  async load(initFn?: () => void): Promise<this> {
    if (this._ready) {
      return this
    }
    this._ready = true
    await this.transact(async () => {
      this.doc.load()
      const { config, renderEngine } = this.editor
      if (config.value.localDb) {
        try {
          await this.loadIndexeddb()
        }
        catch (e) {
          console.error(e)
        }
      }
      await initFn?.()
      if (!this.children.size) {
        this.init()
        await nextTick()
      }
      this._proxyProps(this.root, this.props)
      this._proxyChildren(this.root, this.childrenIds)
      this.childrenIds.forEach((id) => {
        const yNode = this.children.get(id)
        if (yNode) {
          this._getOrCreateNode(yNode)
        }
      })
      renderEngine.value.root.appendChild(this.root)
    }, false)
    this.children.observe(this._onChildrenChange.bind(this) as any)
    this.undoManager.clear()
    return this
  }

  async loadIndexeddb(): Promise<void> {
    const indexeddb = new IndexeddbProvider(this.doc.guid, this.doc)
    await indexeddb.whenSynced
    this.indexeddb = indexeddb
    console.info('loaded data from indexed db')
  }

  protected _onChildrenChange(
    event: Y.YMapEvent<Y.Map<unknown>>,
    _transaction: Y.Transaction,
  ) {
    const { keysChanged, changes } = event

    keysChanged.forEach((key) => {
      const change = changes.keys.get(key)
      // const oldValue = change?.oldValue
      const yNode = this.children.get(key)
      switch (change?.action) {
        case 'add':
          if (yNode) {
            this._getOrCreateNode(yNode)
          }
          break
        case 'delete':
          this.nodeMap.get(key)?.remove()
          this.nodeMap.delete(key)
          break
      }
    })
  }

  reset(): void {
    this.props.clear()
    this.children.clear()
    this.childrenIds.delete(0, this.childrenIds.length)
    this.nodeMap.clear()
  }

  init(): void {
    this.addElement({
      id: 'Frame',
      name: 'Frame',
      style: {
        width: 960,
        height: 540,
        backgroundColor: '#FFFFFF',
        overflow: 'hidden',
      },
      meta: {
        inEditorIs: 'Frame',
        inPptIs: 'Slide',
      },
    })
  }

  protected _addElement(element: Element, options: AddElementOptions = {}): Node {
    const { parentId, index, regenerateId } = options
    const yNodes = iElementToYElements(element, parentId, regenerateId)
    yNodes.forEach((result) => {
      this.children.set(result.id, result.element)
    })
    const nodeMap = yNodes.map(result => this._getOrCreateNode(result.element))
    const root = nodeMap[0]
    const childrenIds = parentId
      ? this.children.get(parentId)?.get('childrenIds')
      : this.childrenIds
    if (childrenIds) {
      if (index === undefined) {
        childrenIds.push([root.id])
      }
      else {
        childrenIds.insert(index, [root.id])
      }
    }
    return root
  }

  addElement(element: Element, options?: AddElementOptions): Node {
    return this.transact(() => this._addElement(element, options))
  }

  addElements(elements: Element[], options?: AddElementOptions): Node[] {
    return this.transact(() => {
      return elements.map(element => this._addElement(element, options))
    })
  }

  setProps(props: Record<string, any>): this {
    this.transact(() => {
      for (const [key, value] of Object.entries(props)) {
        this.props.set(key, value)
      }
    })
    return this
  }

  set(source: Document): this {
    const { children = [], ...props } = source
    this.reset()
    this.addElements(children)
    this.setProps(props)
    return this
  }

  protected _deleteElement(id: string): void {
    const yNode = this.children.get(id)
    if (!yNode) {
      return
    }
    const parentId = yNode.get('parentId')
    const parentChildrenIds = parentId
      ? this.children.get(parentId)?.get('childrenIds')
      : this.childrenIds
    if (parentChildrenIds) {
      const index = parentChildrenIds.toJSON().indexOf(id)
      if (index > -1) {
        parentChildrenIds.delete(index)
      }
    }
    yNode.get('childrenIds').forEach(id => this._deleteElement(id))
    this.children.delete(id)
  }

  deleteElement(id: string): void {
    this.transact(() => this._deleteElement(id))
  }

  moveElement(id: string, toIndex: number): void {
    const yNode = this.children.get(id)
    const parentId = yNode?.get('parentId')
    const childrenIds = parentId
      ? this.children.get(parentId)?.get('childrenIds')
      : this.childrenIds
    if (!childrenIds) {
      return
    }
    const fromIndex = childrenIds.toJSON().indexOf(id)
    childrenIds.delete(fromIndex, 1)
    childrenIds.insert(toIndex, [id])
  }

  protected _proxyProps(obj: CoreObject, yMap: Y.Map<any>): void {
    obj.setPropertyAccessor({
      getProperty: key => yMap.doc ? yMap.get(key) : undefined,
      setProperty: (key, value) => {
        if (this._transacting === false) {
          return
        }
        this.transact(() => yMap.set(key, value))
      },
    })

    const observeFn = (event: YMapEvent<any>, _transaction: Transaction): void => {
      if (event.transaction.origin !== this.undoManager) {
        return
      }
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
              obj.requestUpdate(key, undefined, oldValue)
              break
          }
        })
      }, false)
    }
    ;(obj as any)._yMap = yMap
    ;(obj as any)._yMapObserveFn && yMap.unobserve((obj as any)._yMapObserveFn)
    ;(obj as any)._yMapObserveFn = observeFn
    yMap.observe(observeFn)
  }

  protected _proxyChildren(node: Node, childrenIds: Y.Array<string>): void {
    childrenIds.forEach((id) => {
      const child = this.children.get(id)
      if (child) {
        node.appendChild(this._getOrCreateNode(child))
      }
    })

    const observeFn = (event: YArrayEvent<any>, _transaction: Transaction): void => {
      const children = node.children
      let retain = 0
      event.changes.delta.forEach((action) => {
        if (action.retain !== undefined) {
          retain = action.retain
        }
        if (action.delete) {
          for (let i = retain; i < retain + action.delete; i++) {
            children[i]?.remove()
          }
        }
        if (action.insert) {
          const ids = Array.isArray(action.insert) ? action.insert : [action.insert]
          ids.forEach((id, index) => {
            let child = this.nodeMap.get(id)
            const cb = (child: Node): void => {
              node.moveChild(child, retain + index)
            }
            if (child) {
              cb(child)
            }
            else {
              setTimeout(() => {
                child = this.nodeMap.get(id)
                child && cb(child)
              }, 0)
            }
          })
        }
      })
    }
    ;(node as any)._childrenIds = childrenIds
    ;(node as any)._childrenIdsObserveFn && childrenIds.unobserve((node as any)._childrenIdsObserveFn)
    ;(node as any)._childrenIdsObserveFn = observeFn
    childrenIds.observe(observeFn)
  }

  protected _proxyNode(node: Node, yEle: ElementYMap): void {
    this._proxyProps(node, yEle)

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
    }

    this._proxyChildren(node, yEle.get('childrenIds'))
  }

  protected _getOrCreateNode(yNode: ElementYMap): Node {
    const id = yNode.get('id')
    let node = this.nodeMap.get(id)
    if (!node) {
      this.undoManager.addToScope(yNode)
      node = reactive(
        Node.parse({
          meta: {
            inCanvasIs: yNode.get('meta')?.inCanvasIs,
          },
        }),
      ) as Node
      this._proxyNode(node, yNode)
      this.nodeMap.set(id, node)
    }
    return node
  }

  override destroy(): void {
    super.destroy()
  }
}

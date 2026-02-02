import type { CoreObject } from 'modern-canvas'
import type { PropertyAccessor } from 'modern-idoc'
import type { Transaction, YArrayEvent, YMapEvent } from 'yjs'
import type { YModelEvents } from './YModel'
import { Element2D, Node } from 'modern-canvas'
import { isReactive, markRaw, reactive } from 'vue'
import * as Y from 'yjs'
import { YModel } from './YModel'

export interface AddNodeOptions {
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

export interface YDocEvents extends YModelEvents {
  //
}

export interface YDoc {
  on: <K extends keyof YDocEvents & string>(event: K, listener: (...args: YDocEvents[K]) => void) => this
  once: <K extends keyof YDocEvents & string>(event: K, listener: (...args: YDocEvents[K]) => void) => this
  off: <K extends keyof YDocEvents & string>(event: K, listener: (...args: YDocEvents[K]) => void) => this
  emit: <K extends keyof YDocEvents & string>(event: K, ...args: YDocEvents[K]) => this
}

export class YDoc extends YModel {
  protected _yChildren: Y.Map<YNode>
  protected _yChildrenIds: Y.Array<string>
  _nodeMap = new Map<string, Node>()

  constructor(id?: string) {
    super(id)
    this._yChildren = markRaw(this._yDoc.getMap('children'))
    this._yChildrenIds = markRaw(this._yDoc.getArray('childrenIds') as Y.Array<string>)
    this._setupUndoManager([
      this._yChildren,
      this._yChildrenIds,
    ])
  }

  override async load(initFn?: () => void | Promise<void>): Promise<this> {
    return super.load(async () => {
      await initFn?.()
      this._yChildren.observe(this._yChildrenChange.bind(this) as any)
    })
  }

  protected _isSelfTransaction(transaction: Y.Transaction) {
    return !transaction.origin || transaction.origin === this._yDoc.clientID
  }

  protected _debug(..._args: any[]) {
    // console.log(..._args)
  }

  protected _yChildrenChange(
    event: Y.YMapEvent<Y.Map<unknown>>,
    transaction: Y.Transaction,
  ) {
    if (this._isSelfTransaction(transaction)) {
      return
    }

    this._debug('yChildrenChange', event)

    const { keysChanged, changes } = event

    keysChanged.forEach((key) => {
      const change = changes.keys.get(key)
      const yNode = this._yChildren.get(key)
      switch (change?.action) {
        case 'add':
          if (yNode) {
            this._initYNode(yNode)
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

  override destroy(): void {
    this.reset()
    super.destroy()
  }

  set(root: Node, props: Record<string, any>): this {
    const { meta = {}, ..._props } = props
    this.reset()
    for (const key in _props) {
      this._yProps.set(key, (_props as any)[key])
    }
    this._yProps.set('meta', new Y.Map(Object.entries(meta)))
    this._transacting = true
    this.proxyNode(
      root,
      this._yProps as any,
      this._yChildrenIds,
    )
    return this
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
    node.on('addChild', (child, newIndex) => {
      if (this._transacting === false || child.internalMode !== 'default') {
        return
      }
      this.transact(() => {
        this._debug(`addChild ${child.id}`, child.name, newIndex)
        this.proxyNode(child)
        childrenIds.insert(newIndex, [child.id])
      })
    })
    node.on('removeChild', (child, oldIndex) => {
      if (this._transacting === false || child.internalMode !== 'default') {
        return
      }
      this.transact(() => {
        this._debug(`removeChild ${child.id}`, child.name, oldIndex)
        const index = childrenIds.toJSON().indexOf(child.id)
        if (index > -1) {
          childrenIds.delete(index, 1)
        }
      })
    })

    node.children.forEach((child) => {
      this.proxyNode(child)
    })

    const cachedChildrenIds = childrenIds.toArray()

    const observeFn = (event: YArrayEvent<any>, transaction: Transaction): void => {
      const skip = this._isSelfTransaction(transaction)

      this._debug(`yChildren ${node.id} changes skip:${skip}`, event.changes.delta)

      let retain = 0
      event.changes.delta.forEach((action) => {
        if (action.retain !== undefined) {
          retain += action.retain
        }

        if (action.delete) {
          if (!skip) {
            for (let i = retain; i < retain + action.delete; i++) {
              const id = cachedChildrenIds[i]
              if (!id) {
                continue
              }
              const child = this._nodeMap.get(id)
              if (
                child
                && child.parent?.equal(node)
                && child.getIndex() === i
              ) {
                this.transact(() => {
                  child.remove()
                  this._debug(`yChildren remove ${child.id}`, child.name, i)
                }, false)
              }
            }
          }

          cachedChildrenIds.splice(retain, action.delete)
        }

        if (action.insert) {
          const insert = Array.isArray(action.insert) ? action.insert : [action.insert]

          if (!skip) {
            insert.forEach((id, index) => {
              let child = this._nodeMap.get(id)
              const cb = (child: Node): void => {
                this.transact(() => {
                  node.moveChild(child, retain + index)
                  this._debug(`yChildren insert ${child.id}`, child.name, retain + index)
                }, false)
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
          }

          cachedChildrenIds.splice(retain, 0, ...insert)

          retain += insert.length
        }
      })
    }
    ;(node as any)._childrenIds = markRaw(childrenIds)
    ;(node as any)._childrenIdsObserveFn && childrenIds.unobserve((node as any)._childrenIdsObserveFn)
    ;(node as any)._childrenIdsObserveFn = markRaw(observeFn)
    childrenIds.observe(observeFn)
  }

  proxyNode(node: Node, yNode?: YNode, yChildrenIds?: Y.Array<string>): void {
    if (node.internalMode !== 'default') {
      return
    }

    const id = node.id

    if (!yNode) {
      yNode = this._yChildren.get(id)
    }

    if (!yNode) {
      yNode = new Y.Map<unknown>(Object.entries({
        ...node.getProperties(),
        id,
      })) as YNode
      this._yChildren.set(id, yNode)
      this.undoManager.addToScope(yNode)
    }

    if (!this._nodeMap.has(id)) {
      if (!isReactive(node)) {
        node = reactive(node) as any
        if (node.parent) {
          node.parent.children[node.getIndex()] = node
        }
      }

      this._nodeMap.set(id, node)

      yNode.set('parentId', node.parent?.id)
      node.on('parented', () => {
        yNode.set('parentId', node.parent?.id)
      })

      node.on('destroy', () => {
        this._nodeMap.delete(node.id)
        this._yChildren.delete(node.id)
        this._debug('destroy', node.id)
      })

      this._proxyProps(node, yNode)

      let meta = yNode.get('meta')
      if (!meta || !(meta instanceof Y.Map)) {
        meta = new Y.Map(Object.entries(node.meta.getProperties()))
        yNode.set('meta', meta)
      }
      this._proxyProps(node.meta, meta, true)

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
          let yMap = yNode.get(key) as Y.Map<any> | undefined
          if (!yMap || !(yMap instanceof Y.Map)) {
            yMap = new Y.Map(Object.entries((node as any)[key].getProperties()))
            yNode.set(key, yMap)
          }
          this._proxyProps((node as any)[key], yMap)
        })
        ;(node as any)._text = markRaw((node as any)._text)
        node.text.update()
        node.requestRender()
      }

      if (!yChildrenIds) {
        yChildrenIds = yNode.get('childrenIds')
      }

      if (!yChildrenIds) {
        yChildrenIds = new Y.Array<string>()
        yChildrenIds.push(node.children.map(c => c.id))
        yNode.set('childrenIds', yChildrenIds)
      }

      this._proxyChildren(node, yChildrenIds)
    }
  }

  protected _initYNode(yNode: YNode): Node {
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
      this.proxyNode(node, yNode)
      this._nodeMap.set(id, node)
    }
    return node
  }
}

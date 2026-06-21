import type { CoreObject } from 'modern-canvas'
import type { ObservableEvents, PropertyAccessor } from 'modern-idoc'
import type { Transaction, YArrayEvent, YMapEvent } from 'yjs'
import type { Reactivity } from './reactivity'
import { Element2D, Node } from 'modern-canvas'
import { idGenerator, Observable } from 'modern-idoc'
import * as Y from 'yjs'
import { logger } from '../utils/console'
import { IndexeddbProvider } from './providers'
import { rawReactivity } from './reactivity'

/**
 * 本地编辑产生的事务来源：进入 UndoManager，并向远端广播。
 */
export const LOCAL_ORIGIN = Symbol.for('mce.crdt.local')
/**
 * 内部回放（把远端 / 撤销变更应用到视图）产生的事务来源：不进入 UndoManager，
 * observe 回调据此跳过回写，避免本地↔yjs 回环。
 */
export const INTERNAL_ORIGIN = Symbol.for('mce.crdt.internal')

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
    & ((prop: 'comments') => Y.Map<unknown>)
    & ((prop: 'meta') => Y.Map<unknown>)
    & ((prop: 'childrenIds') => Y.Array<string>)
    & (<T = unknown>(prop: string) => T)
}

export interface YDocEvents extends ObservableEvents {
  history: [arg0: Y.UndoManager]
  update: [arg0: Uint8Array, arg1: any, arg2: Y.Doc, arg3: Transaction]
}

export interface YDoc {
  on: <K extends keyof YDocEvents & string>(event: K, listener: (...args: YDocEvents[K]) => void) => this
  once: <K extends keyof YDocEvents & string>(event: K, listener: (...args: YDocEvents[K]) => void) => this
  off: <K extends keyof YDocEvents & string>(event: K, listener: (...args: YDocEvents[K]) => void) => this
  emit: <K extends keyof YDocEvents & string>(event: K, ...args: YDocEvents[K]) => this
}

export class YDoc extends Observable {
  _transacting?: boolean
  _yDoc: Y.Doc
  _yProps: Y.Map<unknown>
  _yChildren: Y.Map<YNode>
  _yChildrenIds: Y.Array<string>
  _nodeMap = new Map<string, Node>()
  /** 远端子节点顺序变更先于节点创建到达时，挂起的 move 操作，按 childId 暂存。 */
  _pendingInserts = new Map<string, Set<() => void>>()
  indexeddb?: IndexeddbProvider
  declare undoManager: Y.UndoManager
  /** 响应式适配器：解耦 Vue。运行时由上层注入 Vue 实现，测试 / headless 用 rawReactivity。 */
  protected _rx: Reactivity

  constructor(
    public id = idGenerator(),
    reactivity: Reactivity = rawReactivity,
  ) {
    super()
    this._rx = reactivity
    // gc: true（Yjs 默认值，此处显式声明）——删除的内容结构会被垃圾回收，
    // 避免文档随删除操作单调膨胀；离线增量日志由 IndexeddbProvider 按 trimSize 快照压实。
    this._yDoc = this._rx.markRaw(new Y.Doc({ guid: id, gc: true }))
    this._yProps = this._rx.markRaw(this._yDoc.getMap('props'))
    this._yChildren = this._rx.markRaw(this._yDoc.getMap('children'))
    this._yChildrenIds = this._rx.markRaw(this._yDoc.getArray('childrenIds') as Y.Array<string>)
    this._initUndoManager([
      this._yChildren,
      this._yChildrenIds,
    ])
    this._yDoc.on('update', (...args) => this.emit('update', ...args))
    this._yChildren.observe(this._yChildrenChange.bind(this) as any)
  }

  protected _isSelfTransaction(transaction?: Y.Transaction): boolean {
    if (transaction) {
      return transaction.origin === LOCAL_ORIGIN || transaction.origin === INTERNAL_ORIGIN
    }
    else {
      return this._transacting === false
    }
  }

  protected _initUndoManager(typeScope: any[] = []): void {
    const um = this._rx.markRaw(new Y.UndoManager([
      this._yProps,
      ...typeScope,
    ], {
      trackedOrigins: new Set([LOCAL_ORIGIN]),
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

  async loadIndexeddb(): Promise<void> {
    this.indexeddb = await new IndexeddbProvider(this._yDoc.guid, this._yDoc).whenSynced
    logger.info('loaded data from indexed db')
  }

  load(): void {
    this._yDoc.load()
  }

  transact<T>(fn: () => T, should: boolean = true): T {
    if (this._transacting !== undefined) {
      return fn()
    }
    this._transacting = should
    let result = undefined as T
    const doc = this._yDoc
    doc.transact(
      () => {
        try {
          result = fn()
        }
        catch (e) {
          logger.error(`An error occurred while Y.doc ${doc.guid} transacting:`)
          logger.error(e)
        }
      },
      should ? LOCAL_ORIGIN : INTERNAL_ORIGIN,
    )
    this._transacting = undefined
    return result!
  }

  protected _debug(..._args: any[]) {
    // logger.debug(..._args)
  }

  protected _yChildrenChange(
    event: Y.YMapEvent<Y.Map<unknown>>,
    transaction: Y.Transaction,
  ) {
    if (this._isSelfTransaction(transaction)) {
      return
    }

    const { keysChanged, changes } = event

    // 包进 INTERNAL 事务（与 _proxyChildren 的 observeFn 同模式）：远端 apply 驱动的节点初始化
    // 会经 accessor / _proxyProps 把 CRDT 值「对账」回写——这些是本地视图同步，必须走 INTERNAL，
    // 否则 _transacting 为 undefined 时各处守卫失效、写入按 LOCAL 处理而被 provider 回环广播。
    this.transact(() => {
      keysChanged.forEach((id) => {
        const change = changes.keys.get(id)
        const yNode = this._yChildren.get(id)
        switch (change?.action) {
          case 'add':
            if (yNode) {
              this._initYNode(yNode)
              this._debug('[yChildren][add]', id)
            }
            break
          case 'delete':
            this._debug('[yChildren][delete]', id)
            break
        }
      })
    }, false)
  }

  reset(): this {
    this._yProps.clear()
    this._yChildren.clear()
    this._yChildrenIds.delete(0, this._yChildrenIds.length)
    this._nodeMap.forEach((node) => {
      // 跳过本身是 YDoc 的节点（子 yjs 文档由各自 provider 管理生命周期），其余销毁。
      if (!('_yDoc' in node)) {
        node.destroy()
      }
    })
    this._nodeMap.clear()
    this._pendingInserts.clear()
    this.undoManager.clear()
    this.indexeddb?.clearData()
    return this
  }

  override destroy(): void {
    this.reset()
    super.destroy()
  }

  _proxyRoot(root: Node): this {
    const oldTransacting = this._transacting
    this._transacting = true
    this._proxyNode(
      root,
      this._yProps as any,
      this._yChildrenIds,
    )
    this._transacting = oldTransacting
    return this
  }

  protected _proxyProps(obj: CoreObject, yMap: Y.Map<any>, isMeta = false): void {
    const accessor: PropertyAccessor = {
      getProperty: key => yMap.doc ? yMap.get(key) : undefined,
      setProperty: (key, value) => {
        if (this._isSelfTransaction()) {
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
      ;(obj as any)._propertyAccessor = this._rx.markRaw(accessor)
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

      this._debug('[props]', event.keysChanged)

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
    ;(obj as any)._yMap = this._rx.markRaw(yMap)
    ;(obj as any)._yMapObserveFn && yMap.unobserve((obj as any)._yMapObserveFn)
    ;(obj as any)._yMapObserveFn = this._rx.markRaw(observeFn)
    yMap.observe(observeFn)
  }

  protected _proxyChildren(node: Node, childrenIds: Y.Array<string>): void {
    node.on('addChild', (child, newIndex) => {
      if (this._isSelfTransaction() || child.internalMode !== 'default') {
        return
      }
      this.transact(() => {
        const childId = child.id
        this._debug(`[addChild][${childId}]`, child.name, newIndex)
        this._proxyNode(child)
        childrenIds.insert(newIndex, [childId])
      })
    })

    node.on('removeChild', (child, oldIndex) => {
      if (this._isSelfTransaction() || child.internalMode !== 'default') {
        return
      }
      this.transact(() => {
        const childId = child.id
        this._debug(`[removeChild][${childId}]`, child.name, oldIndex)
        const index = childrenIds.toArray().indexOf(childId)
        if (index > -1) {
          childrenIds.delete(index, 1)
        }
      })
    })

    node.children.forEach((child) => {
      this._proxyNode(child)
    })

    const cachedChildrenIds = childrenIds.toArray()

    const observeFn = (event: YArrayEvent<any>, transaction: Transaction): void => {
      const skip = this._isSelfTransaction(transaction)

      let retain = 0
      event.changes.delta.forEach((action) => {
        if (action.retain !== undefined) {
          retain += action.retain
        }

        if (action.delete) {
          if (!skip) {
            const deleted: Node[] = []
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
                deleted.push(child)
                this._debug(`[childrenIds][remove][${id}]`, i)
              }
            }

            if (deleted.length > 0) {
              this.transact(() => {
                deleted.forEach((item) => {
                  item.remove()
                })
              }, false)
            }
          }

          cachedChildrenIds.splice(retain, action.delete)
        }

        if (action.insert) {
          const insert = Array.isArray(action.insert) ? action.insert : [action.insert]

          if (!skip) {
            insert.forEach((id, index) => {
              // 固化目标位置：retain 在本轮 forEach 后会自增，闭包不能引用它（原 setTimeout 版会取到错位的 index）。
              const targetIndex = retain + index
              const run = (child: Node): void => {
                this.transact(() => {
                  node.moveChild(child, targetIndex)
                  this._debug(`[childrenIds][insert][${id}]`, targetIndex)
                }, false)
              }
              const child = this._nodeMap.get(id)
              if (child) {
                run(child)
              }
              else {
                // 节点尚未创建（创建增量更晚到达）：登记挂起，待 _proxyNode 就绪后由 _flushPendingInserts 消费。
                let pending = this._pendingInserts.get(id)
                if (!pending) {
                  pending = new Set()
                  this._pendingInserts.set(id, pending)
                }
                pending.add(() => {
                  const c = this._nodeMap.get(id)
                  if (c) {
                    run(c)
                  }
                })
              }
            })
          }

          cachedChildrenIds.splice(retain, 0, ...insert)

          retain += insert.length
        }
      })
    }
    ;(node as any)._childrenIds = this._rx.markRaw(childrenIds)
    ;(node as any)._childrenIdsObserveFn && childrenIds.unobserve((node as any)._childrenIdsObserveFn)
    ;(node as any)._childrenIdsObserveFn = this._rx.markRaw(observeFn)
    childrenIds.observe(observeFn)

    // 冷快照恢复 / 迟到入会：observe 只回调未来的 delta，不会回放快照里「出生即存在」
    // 的 childrenIds 条目。顶层 childrenIds 是「空→delta」故 observer 会触发，但嵌套节点的
    // childrenIds 在 applyUpdate 时已是满的，observer 永不触发 → 子树丢失。这里主动补挂：
    // 已就位的（实时链路）跳过，缺失节点登记挂起，待其 _proxyNode 就绪后由 _flushPendingInserts 消费。
    cachedChildrenIds.forEach((id, i) => {
      const child = this._nodeMap.get(id)
      if (child && child.parent?.equal(node) && child.getIndex() === i) {
        return
      }
      const run = (c: Node): void => {
        this.transact(() => {
          node.moveChild(c, i)
        }, false)
      }
      if (child) {
        run(child)
      }
      else {
        let pending = this._pendingInserts.get(id)
        if (!pending) {
          pending = new Set()
          this._pendingInserts.set(id, pending)
        }
        pending.add(() => {
          const c = this._nodeMap.get(id)
          if (c) {
            run(c)
          }
        })
      }
    })
  }

  _proxyNode(node: Node, yNode?: YNode, yChildrenIds?: Y.Array<string>): Node {
    if (node.internalMode !== 'default') {
      return node
    }

    const id = node.id

    if (!yNode) {
      yNode = this._yChildren.get(id)
    }

    if (!yNode) {
      yNode = new Y.Map<unknown>(Object.entries({
        ...node.offsetGetProperties(),
        id,
      })) as YNode
      this._yChildren.set(id, yNode)
      this.undoManager.addToScope(yNode)
    }

    const _node = this._nodeMap.get(id)

    if (_node) {
      node = _node
    }
    else {
      if (!this._rx.isReactive(node)) {
        const handle = (node: Node) => {
          if (node instanceof Element2D) {
            if (!(node.text.base as any).__markRaw__) {
              const base = this._rx.markRaw(node.text.base)
              ;(base as any).__markRaw__ = true
              base.setPropertyAccessor(node.text)
              ;(node.text.base as any) = base
            }
          }
        }
        handle(node)
        node.findOne((child) => {
          handle(child)
          return false
        })
        node = this._rx.reactive(node) as any
        if (node.parent) {
          node.parent.children[node.getIndex()] = node
        }
      }

      this._nodeMap.set(id, node)
      this._flushPendingInserts(id)

      // parentId 是结构的次要镜像（主结构由 childrenIds 承载），对端可自行推导。
      // 关键不变量：远端 apply / 内部回放（INTERNAL）路径**绝不能**写 Y.Doc —— 这类写入虽是冗余
      // 回写（yNode 已带正确 parentId），却仍生成真实 yjs 结构、推进本端 clock，而 INTERNAL 又不广播，
      // 于是本端 clock 领先对端、后续 LOCAL 编辑依赖对端永远收不到的 clock → 对端整段挂起(pendingStructs)
      // 同步卡死。故此处与 accessor.setProperty 一样用 _isSelfTransaction 守卫：仅本地真实变更才写并广播。
      const syncParentId = (): void => {
        if (this._isSelfTransaction()) {
          return
        }
        this.transact(() => yNode.set('parentId', node.parent?.id))
      }
      syncParentId()
      node.on('parented', syncParentId)

      this._proxyProps(node, yNode)

      let meta = yNode.get('meta')
      if (!meta || !(meta instanceof Y.Map)) {
        meta = new Y.Map(Object.entries(node.meta.offsetGetProperties()))
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
          'table',
          'chart',
          'comments',
        ].forEach((key) => {
          let yMap = yNode.get(key) as Y.Map<any> | undefined
          if (!yMap || !(yMap instanceof Y.Map)) {
            yMap = new Y.Map(Object.entries((node as any)[key].offsetGetProperties()))
            yNode.set(key, yMap)
          }
          this._proxyProps((node as any)[key], yMap)
        })
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

    return node
  }

  protected _initYNode(yNode: YNode): Node {
    const id = yNode.get('id')
    let node = this._nodeMap.get(id)
    if (!node) {
      this.undoManager.addToScope(yNode)
      node = Node.parse({
        meta: {
          inCanvasIs: yNode.get('meta')?.get('inCanvasIs') as string | undefined,
        },
      }) as Node
      node = this._proxyNode(node, yNode)
      this._nodeMap.set(id, node)
      // _proxyNode 内部按节点初始（Node.parse 随机）id flush，而 childrenIds 里的挂起项是按
      // yNode id 登记的；这里按 yNode id 再 flush 一次，冷快照恢复时父节点才能挂上本节点。
      this._flushPendingInserts(id)
    }
    return node
  }

  /** 节点就绪后消费此前因节点缺失而挂起的 move 操作。 */
  protected _flushPendingInserts(id: string): void {
    const pending = this._pendingInserts.get(id)
    if (pending) {
      this._pendingInserts.delete(id)
      pending.forEach(run => run())
    }
  }

  /**
   * 应用远端增量。origin 必须区别于 LOCAL/INTERNAL，使变更刷新到视图且不进入本端 undo 栈；
   * 默认用 provider/调用方实例做 origin（这里用 this 兜底）。
   */
  applyUpdate(update: Uint8Array, origin: unknown = this): void {
    Y.applyUpdate(this._yDoc, update, origin)
  }

  /** 导出相对 targetStateVector 的差量（不传则全量），用于新端初始同步握手。 */
  encodeStateAsUpdate(targetStateVector?: Uint8Array): Uint8Array {
    return Y.encodeStateAsUpdate(this._yDoc, targetStateVector)
  }

  /** 导出本端状态向量，与对端交换以计算差量。 */
  encodeStateVector(): Uint8Array {
    return Y.encodeStateVector(this._yDoc)
  }
}

import type { NodeEvents } from 'modern-canvas'
import type { Document } from 'modern-idoc'
import { Node } from 'modern-canvas'
import * as Y from 'yjs'
import { YDoc } from '../crdt'
import { vueReactivity } from '../crdt/vueReactivity'

export interface DocEvents extends NodeEvents {
  update: [update: Uint8Array, origin: any]
  history: [arg0: Y.UndoManager]
}

export interface Doc {
  on: <K extends keyof DocEvents & string>(event: K, listener: (...args: DocEvents[K]) => void) => this
  once: <K extends keyof DocEvents & string>(event: K, listener: (...args: DocEvents[K]) => void) => this
  off: <K extends keyof DocEvents & string>(event: K, listener: (...args: DocEvents[K]) => void) => this
  emit: <K extends keyof DocEvents & string>(event: K, ...args: DocEvents[K]) => this
}

export class Doc extends Node {
  _yDoc: YDoc
  protected _source: any

  // 注意：成员名带 Y 前缀，避免与 modern-idoc 基类的 _enqueueUpdate / 更新调度内部成员冲突。
  /** 同一同步批次内累积的增量，flush 时用 Y.mergeUpdates 合并为一条转发——零丢失替代旧的 throttle。 */
  protected _pendingYUpdates: Uint8Array[] = []
  protected _pendingYOrigin: any
  protected _yFlushScheduled = false

  constructor(
    source?: Mce.DocumentSource,
    options?: { name?: string },
  ) {
    super({
      name: options?.name ?? 'Doc',
    })

    let id: string | undefined
    let _source: any | undefined
    if (typeof source === 'string') {
      id = source
    }
    else if (source) {
      if (Array.isArray(source) && source.length === 1) {
        _source = source[0]
      }
      else {
        _source = source
      }

      if (_source && !Array.isArray(_source)) {
        if (_source.meta?.inEditorIs === 'Doc') {
          id = _source.id
        }
        else {
          _source = [_source]
        }
      }
    }

    const _doc = new YDoc(id, vueReactivity)
    _doc._yProps.set('id', this.id)
    _doc._yProps.set('name', this.name)
    _doc.on('update', (update, origin) => this._enqueueYUpdate(update, origin))
    _doc.on('history', um => this.emit('history', um))
    _doc._proxyRoot(this)
    _doc.load()

    this._yDoc = _doc
    this._source = _source
  }

  /**
   * 累积增量并安排一个 microtask 合并转发。
   * - 零丢失：同步批次内的每条增量都进入缓冲，绝不丢弃（旧 throttle 会丢中间增量导致两端发散）。
   * - 合并：一个事件处理器里产生的多个事务在 microtask 边界前合并成一条，降低网络包数。
   * - origin 纯净：origin 变化时先 flush 旧批，避免本地 / 远端增量被合进同一条而丢失来源。
   */
  protected _enqueueYUpdate(update: Uint8Array, origin: any): void {
    if (this._pendingYUpdates.length > 0 && origin !== this._pendingYOrigin) {
      this._flushYUpdates()
    }
    this._pendingYOrigin = origin
    this._pendingYUpdates.push(update)
    if (!this._yFlushScheduled) {
      this._yFlushScheduled = true
      queueMicrotask(() => this._flushYUpdates())
    }
  }

  protected _flushYUpdates(): void {
    this._yFlushScheduled = false
    if (this._pendingYUpdates.length === 0) {
      return
    }
    const updates = this._pendingYUpdates
    this._pendingYUpdates = []
    const merged = updates.length === 1 ? updates[0] : Y.mergeUpdates(updates)
    this.emit('update', merged, this._pendingYOrigin)
  }

  transact = <T>(fn: () => T, should = true): T => this._yDoc.transact(fn, should)
  undo = (): any | null => this._yDoc.undoManager.undo()
  redo = (): any | null => this._yDoc.undoManager.redo()
  stopCapturing = (): void => this._yDoc.undoManager.stopCapturing()
  clearHistory = (): void => this._yDoc.undoManager.clear()
  proxyNode = (node: Node): Node => this._yDoc._proxyNode(node)

  set = (source: Document): this => {
    const { children = [], ...props } = source
    const body = (): void => {
      this._yDoc.reset()
      this.stopCapturing()
      this.resetProperties()
      this.removeChildren()
      this.setProperties(props)
      this.append(children)
    }
    // set 需同时满足两点，缺一不可：
    // ① `_transacting=true`：让 _proxyChildren 的 addChild 把新子节点**镜像进 childrenIds**
    //    （`_isSelfTransaction()` 无参时看 `_transacting===false`，为 false 才镜像；INTERNAL 下为 true 会跳过）。
    // ② 写入处于一个 doc.transact 内、带 LOCAL/INTERNAL origin：让 childrenIds observer 识别为自身事务而
    //    跳过「回插视图」，否则 origin=null 时会把刚插入的子节点 moveChild 回插 → 重新 emit addChild → 再写
    //    childrenIds，反馈循环把每个子节点重复一遍（set 后 tree/childrenIds 翻倍）。
    // 原实现仅做 ①（直接置 _transacting=true），裸调 set() 时缺 ② → 重复；若改成仅 ②（this.transact）则
    // init() 的 transact(false) 嵌套下丢了 ① → childrenIds 不被填充（tree 满、childrenIds 空）。故分两路：
    if (this._yDoc._transacting === undefined) {
      // 裸调：开 LOCAL doc.transact（满足②），其内 _transacting=true（满足①）。
      this._yDoc.transact(body, true)
    }
    else {
      // 已在外层事务内（init=INTERNAL / 协同 setDoc=LOCAL，已满足②）：强制 _transacting=true 满足①，
      // 沿用外层 doc.transact 的 origin，完成后还原。
      const old = this._yDoc._transacting
      this._yDoc._transacting = true
      try {
        body()
      }
      finally {
        this._yDoc._transacting = old
      }
    }
    return this
  }

  loadIndexeddb = async (): Promise<void> => {
    await this._yDoc.loadIndexeddb()
  }

  init = (): this => {
    const source = this._source
    this._source = undefined
    this.transact(() => {
      if (source && typeof source !== 'string') {
        if (Array.isArray(source)) {
          this.set({ children: source })
        }
        else {
          this.set(source)
        }
      }
    }, false)
    this.clearHistory()
    return this
  }

  destroy = () => {
    this._flushYUpdates()
    super.destroy()
    this._yDoc.destroy()
  }
}

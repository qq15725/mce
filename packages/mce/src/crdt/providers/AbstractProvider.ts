import type { ObservableEvents } from 'modern-idoc'
import type { YDoc } from '../YDoc'
import * as decoding from 'lib0/decoding'
import * as encoding from 'lib0/encoding'
import { Observable } from 'modern-idoc'
import * as awarenessProtocol from 'y-protocols/awareness'
import * as syncProtocol from 'y-protocols/sync'
import { INTERNAL_ORIGIN } from '../YDoc'

/**
 * 顶层消息类型。一个消息 = [messageType: varUint, payload...]，房间名由传输层在 URL 等处携带。
 */
export const MESSAGE_SYNC = 0
export const MESSAGE_AWARENESS = 1
export const MESSAGE_QUERY_AWARENESS = 3

export interface AbstractProviderEvents extends ObservableEvents {
  /** 连接状态变化。 */
  status: [{ connected: boolean }]
  /** 首次与对端完成 sync step2，本端已拿到全量状态。 */
  synced: [boolean]
}

/**
 * 可插拔传输层基类。负责 Yjs 同步协议（state vector 握手 + 增量）与 Awareness（在场感知）的
 * 编解码与路由；具体字节怎么收发由子类实现（WebSocket / WebRTC / BroadcastChannel / 自定义）。
 *
 * 关注点分离：
 * - 本类只懂「协议」：何时发 syncStep1、如何把 update / awareness 编成消息、收到消息如何分发。
 * - 子类只懂「传输」：实现 {@link send}，在连接打开时调用 {@link onOpen}，收到字节时调用 {@link receive}。
 *
 * 回环防护：远端增量一律以 `this`（provider 实例）为 origin apply 到文档——既不进入本端
 * UndoManager，又能刷新视图，且本端 'update' 监听据 `origin === this` 跳过再广播。
 */
export abstract class AbstractProvider<
  Events extends AbstractProviderEvents = AbstractProviderEvents,
> extends Observable<Events> {
  readonly awareness: awarenessProtocol.Awareness
  synced = false
  /** 传输层连接状态。随 onOpen / onClose 翻转，供晚挂监听的上层补读初值。 */
  connected = false

  protected _ydoc: YDoc
  protected _doc: YDoc['_yDoc']
  private _onUpdate: (update: Uint8Array, origin: unknown) => void
  private _onAwarenessUpdate: (
    changed: { added: number[], updated: number[], removed: number[] },
    origin: unknown,
  ) => void

  constructor(ydoc: YDoc) {
    super()
    this._ydoc = ydoc
    this._doc = ydoc._yDoc
    this.awareness = new awarenessProtocol.Awareness(this._doc)

    this._onUpdate = (update, origin) => {
      // 不广播两类更新，避免回环 / 回声：
      // - origin === this：远端 apply 进来的（已是对端发来的状态）。
      // - INTERNAL_ORIGIN：把远端 / 撤销变更回放到视图时产生的内部写入（如 _proxyNode 补 parentId、
      //   _proxyChildren 重排）——这些是本地视图同步，对端已各自广播过源变更，再发即回声。
      //   注：LOCAL_ORIGIN（用户编辑）与 UndoManager origin（撤销/重做）不在此列，照常广播。
      if (origin === this || origin === INTERNAL_ORIGIN) {
        return
      }
      const encoder = encoding.createEncoder()
      encoding.writeVarUint(encoder, MESSAGE_SYNC)
      syncProtocol.writeUpdate(encoder, update)
      this.send(encoding.toUint8Array(encoder))
    }

    this._onAwarenessUpdate = ({ added, updated, removed }, origin) => {
      if (origin === this) {
        return
      }
      const changed = added.concat(updated, removed)
      this.send(this._encodeAwareness(changed))
    }

    ydoc.on('update', this._onUpdate as any)
    this.awareness.on('update', this._onAwarenessUpdate as any)

    // 页面卸载时广播「离场」，让其他端及时清掉本端光标。
    if (typeof addEventListener !== 'undefined') {
      addEventListener('beforeunload', this._removeAwareness)
    }
  }

  /** 子类实现：把字节发往对端。连接未就绪时应自行缓冲或丢弃（同步协议可在重连后重放）。 */
  protected abstract send(data: Uint8Array): void

  /**
   * 把本端全量状态作为一条 sync update 主动推给对端。
   *
   * 用于**无中心服务端的 P2P 传输**（如 BroadcastChannel / WebRTC）：step1/step2 握手只能让
   * 「发起方」拉到对端缺失的内容，无法让已在场的对端获得本端新内容。当本端在会话中途换上一份
   * 新内容（如 setDoc 后 provider 重建）时，调用此方法把内容推过去，对端 applyUpdate 即合并。
   * 有服务端的传输（WebSocket）由服务端持久化 + 转发，通常不需要。
   */
  protected broadcastState(): void {
    const encoder = encoding.createEncoder()
    encoding.writeVarUint(encoder, MESSAGE_SYNC)
    syncProtocol.writeUpdate(encoder, this._ydoc.encodeStateAsUpdate())
    this.send(encoding.toUint8Array(encoder))
  }

  /** 连接（重新）建立后由子类调用：发起 sync step1 并广播本端 awareness。 */
  protected onOpen(): void {
    const encoder = encoding.createEncoder()
    encoding.writeVarUint(encoder, MESSAGE_SYNC)
    syncProtocol.writeSyncStep1(encoder, this._doc)
    this.send(encoding.toUint8Array(encoder))

    if (this.awareness.getLocalState() !== null) {
      this.send(this._encodeAwareness([this._doc.clientID]))
    }
    this.connected = true
    this.emit('status', { connected: true } as any)
  }

  /** 连接断开后由子类调用。 */
  protected onClose(): void {
    // 把其他端在本端的 awareness 视图清空（不广播），重连后会重新拉取。
    awarenessProtocol.removeAwarenessStates(
      this.awareness,
      Array.from(this.awareness.getStates().keys()).filter(id => id !== this._doc.clientID),
      this,
    )
    this.connected = false
    this.emit('status', { connected: false } as any)
  }

  /** 子类收到一帧消息字节后调用，路由到 sync / awareness 处理。 */
  protected receive(data: Uint8Array): void {
    const decoder = decoding.createDecoder(data)
    const encoder = encoding.createEncoder()
    const messageType = decoding.readVarUint(decoder)

    switch (messageType) {
      case MESSAGE_SYNC: {
        encoding.writeVarUint(encoder, MESSAGE_SYNC)
        // transactionOrigin = this：远端变更刷新视图、不进 undo、不回环广播。
        const syncType = syncProtocol.readSyncMessage(decoder, encoder, this._doc, this)
        // 收到 step2 表示已拿到对端全量状态 → 标记 synced。
        if (!this.synced && syncType === syncProtocol.messageYjsSyncStep2) {
          this._setSynced(true)
        }
        // readSyncMessage 可能往 encoder 写了回复（如对 step1 回 step2）。
        if (encoding.length(encoder) > 1) {
          this.send(encoding.toUint8Array(encoder))
        }
        break
      }
      case MESSAGE_AWARENESS: {
        awarenessProtocol.applyAwarenessUpdate(
          this.awareness,
          decoding.readVarUint8Array(decoder),
          this,
        )
        break
      }
      case MESSAGE_QUERY_AWARENESS: {
        this.send(this._encodeAwareness(Array.from(this.awareness.getStates().keys())))
        break
      }
    }
  }

  private _encodeAwareness(clients: number[]): Uint8Array {
    const encoder = encoding.createEncoder()
    encoding.writeVarUint(encoder, MESSAGE_AWARENESS)
    encoding.writeVarUint8Array(
      encoder,
      awarenessProtocol.encodeAwarenessUpdate(this.awareness, clients),
    )
    return encoding.toUint8Array(encoder)
  }

  private _removeAwareness = (): void => {
    awarenessProtocol.removeAwarenessStates(this.awareness, [this._doc.clientID], 'unload')
  }

  protected _setSynced(value: boolean): void {
    if (this.synced !== value) {
      this.synced = value
      this.emit('synced', value as any)
    }
  }

  destroy(): void {
    this._removeAwareness()
    this._ydoc.off('update', this._onUpdate as any)
    this.awareness.off('update', this._onAwarenessUpdate as any)
    this.awareness.destroy()
    if (typeof removeEventListener !== 'undefined') {
      removeEventListener('beforeunload', this._removeAwareness)
    }
    super.destroy?.()
  }
}

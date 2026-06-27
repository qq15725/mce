import type { YDoc } from 'mce'
import { AbstractProvider } from './AbstractProvider'

export interface WebsocketProviderOptions {
  /** 是否构造后立即连接，默认 true。 */
  connect?: boolean
  /** 断线重连基础间隔（ms），按指数退避，默认 1000。 */
  reconnectInterval?: number
  /** 最大重连间隔（ms），默认 30000。 */
  maxReconnectInterval?: number
  /** WebSocket 子协议。 */
  protocols?: string | string[]
  /**
   * 心跳间隔（ms），默认 30000。每个间隔若期间无任何消息往来，则判定连接半开/已死并强制
   * 关闭以触发重连——纯靠 onclose 无法发现 TCP 黑洞（半开连接）。设为 0 关闭心跳。
   */
  pingInterval?: number
  /** 离线待发缓冲上界（条），默认 1024。溢出后丢弃新增并在重连时全量补推，防内存无界增长。 */
  maxPendingMessages?: number
  /** awareness 过期阈值（ms），透传基类，默认 30000。 */
  awarenessTimeout?: number
}

/**
 * 基于 WebSocket 的传输实现，协议与 y-websocket 服务端兼容：
 * 连接地址为 `${url}/${room}`，二进制帧承载 {@link AbstractProvider} 定义的 sync / awareness 消息。
 *
 * 特性：指数退避重连、连接未就绪时缓冲消息、`onOpen` 自动发起 state vector 握手。
 */
export class WebsocketProvider extends AbstractProvider {
  readonly url: string
  ws: WebSocket | null = null
  shouldConnect: boolean

  private readonly _reconnectInterval: number
  private readonly _maxReconnectInterval: number
  private readonly _protocols?: string | string[]
  private readonly _pingInterval: number
  private readonly _maxPending: number
  private _reconnectAttempts = 0
  private _reconnectTimer: any = null
  private _pingTimer: any = null
  /** 心跳：上个间隔内是否收到过任何消息。无则判定连接已死。 */
  private _aliveSinceLastPing = false
  /** 缓冲是否曾因超上界而丢弃 → 重连时需全量补推。 */
  private _droppedPending = false
  /** 连接未 OPEN 时缓冲待发字节，OPEN 后冲刷。 */
  private _pending: Uint8Array[] = []

  constructor(
    url: string,
    room: string,
    ydoc: YDoc,
    options: WebsocketProviderOptions = {},
  ) {
    super(ydoc, { awarenessTimeout: options.awarenessTimeout })
    this.url = `${url.replace(/\/$/, '')}/${room}`
    this._reconnectInterval = options.reconnectInterval ?? 1000
    this._maxReconnectInterval = options.maxReconnectInterval ?? 30000
    this._protocols = options.protocols
    this._pingInterval = options.pingInterval ?? 30000
    this._maxPending = options.maxPendingMessages ?? 1024
    this.shouldConnect = options.connect ?? true
    if (this.shouldConnect) {
      this.connect()
    }
  }

  connect(): void {
    this.shouldConnect = true
    if (this.ws) {
      return
    }
    const ws = new WebSocket(this.url, this._protocols as any)
    ws.binaryType = 'arraybuffer'
    this.ws = ws

    ws.onopen = () => {
      this._reconnectAttempts = 0
      // 冲刷握手前缓冲的消息。
      const pending = this._pending
      this._pending = []
      pending.forEach(data => ws.send(data as BufferSource))
      this.onOpen()
      // 缓冲曾溢出丢弃 → 全量补推，保证离线期间的编辑不丢（CRDT 幂等合并）。
      if (this._droppedPending) {
        this._droppedPending = false
        this.broadcastState()
      }
      this._startHeartbeat()
    }
    ws.onmessage = (event: MessageEvent) => {
      this._aliveSinceLastPing = true
      this.receive(new Uint8Array(event.data as ArrayBuffer))
    }
    ws.onclose = () => {
      this.ws = null
      this._stopHeartbeat()
      this.onClose()
      this._setSynced(false)
      if (this.shouldConnect) {
        this._scheduleReconnect()
      }
    }
    ws.onerror = () => {
      ws.close()
    }
  }

  disconnect(): void {
    this.shouldConnect = false
    if (this._reconnectTimer) {
      clearTimeout(this._reconnectTimer)
      this._reconnectTimer = null
    }
    this._stopHeartbeat()
    this.ws?.close()
  }

  protected send(data: Uint8Array): void {
    const ws = this.ws
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(data as BufferSource)
    }
    else if (this._pending.length < this._maxPending) {
      this._pending.push(data)
    }
    else {
      // 缓冲已达上界：丢弃并标记，重连时经 broadcastState 全量补推（避免离线长编辑内存无界）。
      this._droppedPending = true
    }
  }

  /**
   * 心跳探活：每 {@link _pingInterval} 检查上个间隔是否有消息往来。无 → 连接半开/已死，
   * 强制 close 触发重连；有 → 复位标记并发一次 syncStep1 当 keepalive（对端会回 step2 → 产生回流）。
   * 纯靠 onclose 无法发现 TCP 黑洞，这里用应用层心跳兜底。
   */
  private _startHeartbeat(): void {
    if (this._pingInterval <= 0 || typeof setInterval === 'undefined') {
      return
    }
    this._stopHeartbeat()
    this._aliveSinceLastPing = true
    this._pingTimer = setInterval(() => {
      const ws = this.ws
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        return
      }
      if (!this._aliveSinceLastPing) {
        ws.close() // 上个间隔无任何消息 → 判定已死，关闭以触发重连
        return
      }
      this._aliveSinceLastPing = false
      this.requestSync() // syncStep1 作 keepalive（对端会回 step2 → 产生回流刷新存活）
    }, this._pingInterval)
  }

  private _stopHeartbeat(): void {
    if (this._pingTimer) {
      clearInterval(this._pingTimer)
      this._pingTimer = null
    }
  }

  private _scheduleReconnect(): void {
    if (this._reconnectTimer) {
      return
    }
    // 指数退避，封顶 maxReconnectInterval。
    const delay = Math.min(
      this._reconnectInterval * 2 ** this._reconnectAttempts,
      this._maxReconnectInterval,
    )
    this._reconnectAttempts++
    this._reconnectTimer = setTimeout(() => {
      this._reconnectTimer = null
      if (this.shouldConnect) {
        this.connect()
      }
    }, delay)
  }

  override destroy(): void {
    this.disconnect()
    super.destroy()
  }
}

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
  private _reconnectAttempts = 0
  private _reconnectTimer: any = null
  /** 连接未 OPEN 时缓冲待发字节，OPEN 后冲刷。 */
  private _pending: Uint8Array[] = []

  constructor(
    url: string,
    room: string,
    ydoc: YDoc,
    options: WebsocketProviderOptions = {},
  ) {
    super(ydoc)
    this.url = `${url.replace(/\/$/, '')}/${room}`
    this._reconnectInterval = options.reconnectInterval ?? 1000
    this._maxReconnectInterval = options.maxReconnectInterval ?? 30000
    this._protocols = options.protocols
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
    }
    ws.onmessage = (event: MessageEvent) => {
      this.receive(new Uint8Array(event.data as ArrayBuffer))
    }
    ws.onclose = () => {
      this.ws = null
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
    this.ws?.close()
  }

  protected send(data: Uint8Array): void {
    const ws = this.ws
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(data as BufferSource)
    }
    else {
      this._pending.push(data)
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

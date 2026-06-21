import { YDoc } from 'mce'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { WebsocketProvider } from './WebsocketProvider'

/**
 * 可控的 WebSocket 替身：构造后停在 CONNECTING，由测试显式触发 open / message / close，
 * 用于在无网络下验证 {@link WebsocketProvider} 的缓冲 / 冲刷 / 重连行为。
 */
class MockWebSocket {
  static CONNECTING = 0
  static OPEN = 1
  static CLOSING = 2
  static CLOSED = 3
  /** 历次被构造的实例，断言重连时新建了连接。 */
  static instances: MockWebSocket[] = []

  readyState = MockWebSocket.CONNECTING
  binaryType = ''
  sent: Uint8Array[] = []
  onopen: (() => void) | null = null
  onmessage: ((e: { data: any }) => void) | null = null
  onclose: (() => void) | null = null
  onerror: (() => void) | null = null

  constructor(public url: string) {
    MockWebSocket.instances.push(this)
  }

  send(data: Uint8Array): void {
    this.sent.push(data)
  }

  close(): void {
    if (this.readyState === MockWebSocket.CLOSED) {
      return
    }
    this.readyState = MockWebSocket.CLOSED
    this.onclose?.()
  }

  // —— 测试触发器 ——
  open(): void {
    this.readyState = MockWebSocket.OPEN
    this.onopen?.()
  }

  message(data: any): void {
    this.onmessage?.({ data })
  }
}

describe('websocketProvider 离线缓冲 / 重连', () => {
  let originalWebSocket: any

  beforeEach(() => {
    MockWebSocket.instances = []
    originalWebSocket = (globalThis as any).WebSocket
    ;(globalThis as any).WebSocket = MockWebSocket as any
  })

  afterEach(() => {
    ;(globalThis as any).WebSocket = originalWebSocket
    vi.useRealTimers()
  })

  it('连接未就绪时缓冲待发字节，onopen 后冲刷并发起握手', () => {
    const ydoc = new YDoc()
    const provider = new WebsocketProvider('ws://x', 'room', ydoc)
    const ws = MockWebSocket.instances[0]
    expect(ws.readyState).toBe(MockWebSocket.CONNECTING)

    // 连接就绪前的本地编辑：应被缓冲，尚未真正发出。
    ydoc.transact(() => ydoc._yProps.set('a', 1))
    expect(ws.sent.length).toBe(0)

    // 连接打开：冲刷缓冲 + 发 syncStep1（握手），故至少有 2 帧。
    ws.open()
    expect(ws.sent.length).toBeGreaterThanOrEqual(2)

    provider.disconnect()
  })

  it('断开后按退避重连，重新建立连接', () => {
    vi.useFakeTimers()
    const ydoc = new YDoc()
    const provider = new WebsocketProvider('ws://x', 'room', ydoc, { reconnectInterval: 100 })
    const ws = MockWebSocket.instances[0]
    ws.open()
    expect(provider.synced).toBe(false) // 尚未收到对端 step2

    // 连接断开：应复位并安排重连。
    ws.close()
    expect(MockWebSocket.instances.length).toBe(1)

    // 退避到点后应新建连接。
    vi.advanceTimersByTime(100)
    expect(MockWebSocket.instances.length).toBe(2)

    provider.disconnect()
  })

  it('disconnect 后不再重连', () => {
    vi.useFakeTimers()
    const ydoc = new YDoc()
    const provider = new WebsocketProvider('ws://x', 'room', ydoc, { reconnectInterval: 100 })
    const ws = MockWebSocket.instances[0]
    ws.open()

    provider.disconnect()
    ws.close()

    vi.advanceTimersByTime(1000)
    // disconnect 把 shouldConnect 置 false，不应再新建连接。
    expect(MockWebSocket.instances.length).toBe(1)
  })

  it('重连成功后清空缓冲（onopen 冲刷的是断连期间累积的增量）', () => {
    vi.useFakeTimers()
    const ydoc = new YDoc()
    const provider = new WebsocketProvider('ws://x', 'room', ydoc, { reconnectInterval: 100 })
    const ws1 = MockWebSocket.instances[0]
    ws1.open()
    ws1.close()

    // 断连期间的本地编辑：缓冲，不丢。
    ydoc.transact(() => ydoc._yProps.set('offline', true))

    // 重连。
    vi.advanceTimersByTime(100)
    const ws2 = MockWebSocket.instances[1]
    expect(ws2).toBeTruthy()
    ws2.open()
    // 离线期间累积的增量在新连接 onopen 时冲刷出去。
    expect(ws2.sent.length).toBeGreaterThanOrEqual(1)

    provider.disconnect()
  })
})

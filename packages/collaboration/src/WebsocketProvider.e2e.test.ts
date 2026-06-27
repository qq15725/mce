import type { YDoc } from 'mce'
import * as decoding from 'lib0/decoding'
import * as encoding from 'lib0/encoding'
import { Doc } from 'mce'
import { Element2D, Node, setCanvasFactory } from 'modern-canvas'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import * as syncProtocol from 'y-protocols/sync'
import * as Y from 'yjs'
import { WebsocketProvider } from './WebsocketProvider'

// 纯 Node：注入零依赖 stub canvas（同 YDoc.test.ts）
setCanvasFactory((w = 1, h = 1) => ({
  width: w,
  height: h,
  getContext: () => null,
  style: {},
  addEventListener() {},
  removeEventListener() {},
}) as any)

const MESSAGE_SYNC = 0
const MESSAGE_AWARENESS = 1

/**
 * 忠实模拟 y-websocket 服务端的内存 hub：
 * - 每个 room 持有一份权威 Y.Doc（持久化）。
 * - 客户端连上 → 服务端发 syncStep1 拉取其状态；客户端 step1 → 服务端回 step2。
 * - 客户端发来的 sync update 应用到 room.doc，并广播给同房其余客户端（不回声发送方）。
 * - awareness 原样中继给同房其余客户端。
 * 通过 dropClient 注入网络断开故障。
 */
class Hub {
  rooms = new Map<string, { doc: Y.Doc, conns: Set<MockWebSocket>, unbind?: () => void }>()

  reset(): void {
    this.rooms.forEach(r => r.unbind?.())
    this.rooms.clear()
  }

  private room(url: string) {
    let r = this.rooms.get(url)
    if (!r) {
      const doc = new Y.Doc()
      const onUpdate = (update: Uint8Array, origin: any): void => {
        // 把应用到 room.doc 的增量广播给除来源外的所有在线客户端
        const enc = encoding.createEncoder()
        encoding.writeVarUint(enc, MESSAGE_SYNC)
        syncProtocol.writeUpdate(enc, update)
        const msg = encoding.toUint8Array(enc)
        for (const c of r!.conns) {
          if (c !== origin && c.serverOpen)
            c.deliver(msg)
        }
      }
      doc.on('update', onUpdate)
      r = { doc, conns: new Set(), unbind: () => doc.off('update', onUpdate) }
      this.rooms.set(url, r)
    }
    return r
  }

  register(ws: MockWebSocket): void {
    const r = this.room(ws.url)
    r.conns.add(ws)
    ws.hubRoom = r
  }

  /** 客户端 OPEN：服务端发 step1 拉取客户端状态（y-websocket 行为）。 */
  serverHandshake(ws: MockWebSocket): void {
    const r = ws.hubRoom!
    const enc = encoding.createEncoder()
    encoding.writeVarUint(enc, MESSAGE_SYNC)
    syncProtocol.writeSyncStep1(enc, r.doc)
    ws.deliver(encoding.toUint8Array(enc))
  }

  onClientSend(ws: MockWebSocket, data: Uint8Array): void {
    if (!ws.serverOpen)
      return
    const r = ws.hubRoom!
    const decoder = decoding.createDecoder(data)
    const messageType = decoding.readVarUint(decoder)
    if (messageType === MESSAGE_SYNC) {
      const encoder = encoding.createEncoder()
      encoding.writeVarUint(encoder, MESSAGE_SYNC)
      // origin = ws：应用产生的增量广播时排除该来源
      syncProtocol.readSyncMessage(decoder, encoder, r.doc, ws)
      if (encoding.length(encoder) > 1)
        ws.deliver(encoding.toUint8Array(encoder))
    }
    else if (messageType === MESSAGE_AWARENESS) {
      for (const c of r.conns) {
        if (c !== ws && c.serverOpen)
          c.deliver(data)
      }
    }
  }

  /** 模拟单个客户端网络断开（服务端侧感知 close）。 */
  dropClient(ws: MockWebSocket): void {
    ws.hubRoom?.conns.delete(ws)
    ws.serverOpen = false
    ws.netClose()
  }
}

const hub = new Hub()

class MockWebSocket {
  static CONNECTING = 0
  static OPEN = 1
  static CLOSING = 2
  static CLOSED = 3
  static instances: MockWebSocket[] = []

  readyState = MockWebSocket.CONNECTING
  binaryType = ''
  serverOpen = false
  hubRoom: { doc: Y.Doc, conns: Set<MockWebSocket> } | null = null
  onopen: (() => void) | null = null
  onmessage: ((e: { data: any }) => void) | null = null
  onclose: (() => void) | null = null
  onerror: (() => void) | null = null

  constructor(public url: string) {
    MockWebSocket.instances.push(this)
    hub.register(this)
  }

  send(data: Uint8Array): void {
    hub.onClientSend(this, data)
  }

  close(): void {
    if (this.readyState === MockWebSocket.CLOSED)
      return
    this.netClose()
  }

  // 客户端侧 onmessage 投递（服务端 → 客户端）。异步（microtask）投递，贴近真实 ws：
  // 真实 ws 消息是异步到达的，同步重入投递会打乱 Doc 的 microtask 增量合批，造成假阳性。
  deliver(data: Uint8Array): void {
    if (this.readyState !== MockWebSocket.OPEN)
      return
    const ab = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength)
    queueMicrotask(() => {
      if (this.readyState === MockWebSocket.OPEN)
        this.onmessage?.({ data: ab })
    })
  }

  netClose(): void {
    if (this.readyState === MockWebSocket.CLOSED)
      return
    this.readyState = MockWebSocket.CLOSED
    this.serverOpen = false
    this.hubRoom?.conns.delete(this)
    this.onclose?.()
  }

  // —— 测试触发：打开连接（客户端 onopen + 服务端握手）——
  open(): void {
    this.readyState = MockWebSocket.OPEN
    this.serverOpen = true
    this.onopen?.()
    hub.serverHandshake(this)
  }
}

/** 打开所有仍处于 CONNECTING 的连接（含重连新建的）。 */
function openAll(): void {
  for (const ws of MockWebSocket.instances) {
    if (ws.readyState === MockWebSocket.CONNECTING)
      ws.open()
  }
}

const flush = (ms = 0): Promise<void> => new Promise(r => setTimeout(r, ms))

function childIds(node: Node): string[] {
  return node.children.map(c => c.id)
}

interface Client {
  doc: Doc
  provider: WebsocketProvider
}
// 每个测试用独立 room，避免共享 hub / 重连定时器跨测试串味（测试隔离）。
let roomSeq = 0
let currentRoom = 'r0'
const created: WebsocketProvider[] = []
function makeClient(room = currentRoom, opts: Record<string, any> = {}): Client {
  const doc = new Doc([])
  const provider = new WebsocketProvider('ws://test', room, doc._yDoc as unknown as YDoc, {
    reconnectInterval: 20,
    maxReconnectInterval: 40,
    pingInterval: 0, // 默认关心跳，避免干扰常规用例；需要的用例显式开启
    ...opts,
  })
  created.push(provider)
  return { doc, provider }
}

describe('websocket 端到端（经模拟 y-websocket 服务端中继）', () => {
  beforeEach(() => {
    MockWebSocket.instances = []
    hub.reset()
    currentRoom = `r${roomSeq++}`
    ;(globalThis as any).WebSocket = MockWebSocket as any
  })
  afterEach(() => {
    created.forEach(p => p.destroy())
    created.length = 0
    MockWebSocket.instances.forEach(ws => ws.netClose())
  })

  it('两端经服务端同步：增删改收敛', async () => {
    const a = makeClient()
    const b = makeClient()
    openAll()
    await flush()

    const n1 = new Node({ name: 'n1' })
    a.doc.append(n1)
    await flush()
    expect(childIds(b.doc)).toEqual([n1.id])

    const el = new Element2D()
    b.doc.append(el)
    await flush()
    expect([...childIds(a.doc)].sort()).toEqual([n1.id, el.id].sort())

    a.doc.findOne((x: any) => x.id === el.id) && (a.doc.findOne((x: any) => x.id === el.id) as any).style.setProperties({ left: 42 })
    await flush()
    expect((b.doc.findOne((x: any) => x.id === el.id) as any).style.left).toBe(42)

    a.provider.destroy()
    b.provider.destroy()
  })

  // —— 操作矩阵：把各类真实编辑操作都经真实 WebsocketProvider 走一遍，验证逐项收敛 ——

  it('[操作] 重排 moveChild 经 ws 同步', async () => {
    const a = makeClient()
    const b = makeClient()
    openAll()
    await flush()
    const ns = Array.from({ length: 3 }, (_, i) => new Node({ name: `n${i}` }))
    ns.forEach(n => a.doc.append(n))
    await flush()
    a.doc.moveChild(a.doc.findOne((x: any) => x.id === ns[0].id) as any, 2)
    await flush()
    expect(childIds(b.doc)).toEqual(childIds(a.doc))
    expect(childIds(a.doc)).toEqual([ns[1].id, ns[2].id, ns[0].id])
    a.provider.destroy()
    b.provider.destroy()
  })

  it('[操作] 跨父 reparent 经 ws 同步', async () => {
    const a = makeClient()
    const b = makeClient()
    openAll()
    await flush()
    const p1 = new Node({ name: 'p1' })
    const p2 = new Node({ name: 'p2' })
    const child = new Node({ name: 'c' })
    a.doc.append(p1)
    a.doc.append(p2)
    p1.append(child)
    await flush()
    ;(a.doc.findOne((x: any) => x.id === p2.id) as any).append(a.doc.findOne((x: any) => x.id === child.id))
    await flush()
    expect(childIds(b.doc.findOne((x: any) => x.id === p1.id) as any)).toEqual([])
    expect(childIds(b.doc.findOne((x: any) => x.id === p2.id) as any)).toEqual([child.id])
    a.provider.destroy()
    b.provider.destroy()
  })

  it('[操作] 删除 remove 经 ws 同步', async () => {
    const a = makeClient()
    const b = makeClient()
    openAll()
    await flush()
    const n1 = new Node({ name: 'n1' })
    const n2 = new Node({ name: 'n2' })
    a.doc.append(n1)
    a.doc.append(n2)
    await flush()
    ;(a.doc.findOne((x: any) => x.id === n1.id) as any).remove()
    await flush()
    expect(childIds(b.doc)).toEqual([n2.id])
    a.provider.destroy()
    b.provider.destroy()
  })

  it('[操作] undo / redo 经 ws 同步', async () => {
    const a = makeClient()
    const b = makeClient()
    openAll()
    await flush()
    const n = new Node({ name: 'u' })
    a.doc.append(n)
    await flush()
    expect(childIds(b.doc)).toEqual([n.id])
    ;(a.doc._yDoc as any).undoManager.undo()
    await flush()
    expect(childIds(b.doc)).toEqual([])
    ;(a.doc._yDoc as any).undoManager.redo()
    await flush()
    expect(childIds(b.doc)).toEqual([n.id])
    a.provider.destroy()
    b.provider.destroy()
  })

  it('[操作] 多子对象（text/fill/outline/shadow）经 ws 同步', async () => {
    const a = makeClient()
    const b = makeClient()
    openAll()
    await flush()
    const el = new Element2D()
    a.doc.append(el)
    await flush()
    const la: any = a.doc.findOne((x: any) => x.id === el.id)
    la.text.setProperties({ content: 'hi' })
    la.fill.setProperties({ color: '#ff0000' })
    la.outline.setProperties({ color: '#00ff00', width: 2 })
    la.shadow.setProperties({ color: '#000000', blur: 4 })
    await flush()
    const rb: any = b.doc.findOne((x: any) => x.id === el.id)
    expect(rb.fill.toJSON()).toEqual(la.fill.toJSON())
    expect(rb.outline.toJSON()).toEqual(la.outline.toJSON())
    expect(rb.shadow.toJSON()).toEqual(la.shadow.toJSON())
    expect(rb.text.toJSON()).toEqual(la.text.toJSON())
    a.provider.destroy()
    b.provider.destroy()
  })

  it('[操作] connection 连线子对象经 ws 同步', async () => {
    const a = makeClient()
    const b = makeClient()
    openAll()
    await flush()
    const el = new Element2D()
    el.connection.setProperties({ start: { id: 'x', idx: 0 }, end: { id: 'y', idx: 1 }, mode: 'orthogonal' })
    a.doc.append(el)
    await flush()
    const rb: any = b.doc.findOne((x: any) => x.id === el.id)
    expect(rb.connection.toJSON()).toEqual((a.doc.findOne((x: any) => x.id === el.id) as any).connection.toJSON())
    a.provider.destroy()
    b.provider.destroy()
  })

  // 注：comments（动态 key 子对象）经 ws 的收敛在真实浏览器双标签 + 真实 y-websocket 服务端下
  // 已手动验证通过（依赖 crdt/YDoc.ts 的 setProperty 远端回写修复）。此处不放 mock 用例：
  // 本文件的 new Doc()+MockWebSocket 走 new Element2D()+setProperty 的低层路径，无法忠实复现真实
  // 编辑器 addElement/addThread 在节点创建事务内一并广播子 Map 的时序，曾给出与浏览器相反的假结论。
  // 单元收敛覆盖见 packages/mce/src/crdt/collab.test.ts 的 comments 用例。

  it('[操作] table 子对象经 ws 同步', async () => {
    const a = makeClient()
    const b = makeClient()
    openAll()
    await flush()
    const el = new Element2D()
    a.doc.append(el)
    await flush()
    const la: any = a.doc.findOne((x: any) => x.id === el.id)
    la.table.setProperties({
      columns: [{ width: 100 }, { width: 100 }],
      rows: [{ height: 30 }, { height: 30 }],
      cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }],
    })
    await flush()
    const rb: any = b.doc.findOne((x: any) => x.id === el.id)
    expect(rb.table.toJSON()).toEqual(la.table.toJSON())
    a.provider.destroy()
    b.provider.destroy()
  })

  it('[操作] 同元素并发改不同/相同属性经 ws 收敛', async () => {
    const a = makeClient()
    const b = makeClient()
    openAll()
    await flush()
    const el = new Element2D()
    a.doc.append(el)
    await flush()
    const la: any = a.doc.findOne((x: any) => x.id === el.id)
    const lb: any = b.doc.findOne((x: any) => x.id === el.id)
    // 不同属性
    la.style.setProperties({ left: 200 })
    lb.style.setProperties({ top: 150 })
    await flush()
    for (const d of [a, b]) {
      const r: any = d.doc.findOne((x: any) => x.id === el.id)
      expect(r.style.left).toBe(200)
      expect(r.style.top).toBe(150)
    }
    // 相同属性 → 收敛到同一值
    la.style.setProperties({ left: 10 })
    lb.style.setProperties({ left: 20 })
    await flush()
    const va = (a.doc.findOne((x: any) => x.id === el.id) as any).style.left
    expect((b.doc.findOne((x: any) => x.id === el.id) as any).style.left).toBe(va)
    a.provider.destroy()
    b.provider.destroy()
  })

  it('[操作] 嵌套增 + 子层重排经 ws 同步', async () => {
    const a = makeClient()
    const b = makeClient()
    openAll()
    await flush()
    const group = new Node({ name: 'g' })
    a.doc.append(group)
    const c1 = new Node({ name: 'c1' })
    const c2 = new Node({ name: 'c2' })
    group.append(c1)
    group.append(c2)
    await flush()
    expect(childIds(b.doc.findOne((x: any) => x.id === group.id) as any)).toEqual([c1.id, c2.id])
    ;(a.doc.findOne((x: any) => x.id === group.id) as any).moveChild(a.doc.findOne((x: any) => x.id === c2.id), 0)
    await flush()
    expect(childIds(b.doc.findOne((x: any) => x.id === group.id) as any)).toEqual([c2.id, c1.id])
    a.provider.destroy()
    b.provider.destroy()
  })

  it('[操作] 快速连续多次编辑（同 tick mergeUpdates）经 ws 不丢', async () => {
    const a = makeClient()
    const b = makeClient()
    openAll()
    await flush()
    const ns = Array.from({ length: 20 }, (_, i) => new Node({ name: `m${i}` }))
    ns.forEach(n => a.doc.append(n)) // 同步循环，一个 tick 内
    await flush()
    expect(childIds(b.doc)).toEqual(ns.map(n => n.id))
    a.provider.destroy()
    b.provider.destroy()
  })

  it('后加入者经服务端 step1/step2 拿到已有全量', async () => {
    const a = makeClient()
    openAll()
    await flush()
    a.doc.append(new Node({ name: 'pre1' }))
    a.doc.append(new Node({ name: 'pre2' }))
    await flush()

    // 迟到加入
    const b = makeClient()
    openAll()
    await flush()

    expect(childIds(b.doc)).toEqual(childIds(a.doc))
    expect(childIds(b.doc).length).toBe(2)

    a.provider.destroy()
    b.provider.destroy()
  })

  it('断线重连：离线期间双方各自编辑，重连后收敛（不丢改动）', async () => {
    const a = makeClient()
    const b = makeClient()
    openAll()
    await flush()

    const base = new Node({ name: 'base' })
    a.doc.append(base)
    await flush()
    expect(childIds(b.doc)).toEqual([base.id])

    // A 掉线
    const aWs = a.provider.ws as unknown as MockWebSocket
    hub.dropClient(aWs)
    await flush()
    expect(a.provider.connected).toBe(false)

    // 离线期间：A 本地编辑（应缓冲），B 在线编辑（进服务端）
    const offA = new Node({ name: 'offA' })
    const onB = new Node({ name: 'onB' })
    a.doc.append(offA)
    b.doc.append(onB)
    await flush()

    // 等待退避重连新建连接并打开
    await flush(40)
    openAll()
    await flush()

    expect(a.provider.connected).toBe(true)
    const expected = [base.id, offA.id, onB.id].sort()
    expect([...childIds(a.doc)].sort()).toEqual(expected)
    expect([...childIds(b.doc)].sort()).toEqual(expected)

    a.provider.destroy()
    b.provider.destroy()
  })

  it('断线期间远端多次编辑，重连后全部补齐', async () => {
    const a = makeClient()
    const b = makeClient()
    openAll()
    await flush()

    hub.dropClient(a.provider.ws as unknown as MockWebSocket)
    await flush()

    const ids: string[] = []
    for (let i = 0; i < 5; i++) {
      const n = new Node({ name: `r${i}` })
      ids.push(n.id)
      b.doc.append(n)
    }
    await flush()
    // A 离线，看不到
    expect(childIds(a.doc).length).toBe(0)

    await flush(40)
    openAll()
    await flush()

    expect([...childIds(a.doc)].sort()).toEqual([...ids].sort())

    a.provider.destroy()
    b.provider.destroy()
  })

  it('三端经服务端中继收敛', async () => {
    const a = makeClient()
    const b = makeClient()
    const c = makeClient()
    openAll()
    await flush()

    const na = new Node({ name: 'a' })
    const nb = new Node({ name: 'b' })
    const nc = new Node({ name: 'c' })
    a.doc.append(na)
    b.doc.append(nb)
    c.doc.append(nc)
    await flush()

    const ids = [na.id, nb.id, nc.id].sort()
    expect([...childIds(a.doc)].sort()).toEqual(ids)
    expect([...childIds(b.doc)].sort()).toEqual(ids)
    expect([...childIds(c.doc)].sort()).toEqual(ids)

    a.provider.destroy()
    b.provider.destroy()
    c.provider.destroy()
  })

  it('在场感知：重连后对端能重新看到本端光标', async () => {
    const a = makeClient()
    const b = makeClient()
    openAll()
    await flush()

    a.provider.awareness.setLocalState({ user: 'A', cursor: { x: 1, y: 2 } })
    b.provider.awareness.setLocalState({ user: 'B' })
    await flush()

    const aId = (a.doc._yDoc as any)._yDoc.clientID
    // B 能看到 A
    expect(b.provider.awareness.getStates().get(aId)?.user).toBe('A')

    // A 掉线 → B 侧应清掉 A
    hub.dropClient(a.provider.ws as unknown as MockWebSocket)
    await flush()

    // A 重连
    await flush(40)
    openAll()
    await flush()
    expect(a.provider.connected).toBe(true)

    // 重连后 B 应能重新看到 A 的光标
    expect(b.provider.awareness.getStates().get(aId)?.user).toBe('A')

    a.provider.destroy()
    b.provider.destroy()
  })

  // —— 以下为已修复的 WebsocketProvider 健壮性机制（awareness 过期 / 心跳探活 / _pending 上界）。——

  it('[健壮性] awareness 过期：对端半开消失后其陈旧光标被清除（无 ghost cursor）', async () => {
    const a = makeClient(undefined, { awarenessTimeout: 40 })
    const b = makeClient(undefined, { awarenessTimeout: 40 })
    openAll()
    await flush()
    b.provider.awareness.setLocalState({ user: 'B' })
    await flush()
    const bId = (b.doc._yDoc as any)._yDoc.clientID
    expect(a.provider.awareness.getStates().has(bId)).toBe(true)

    // B 的连接「半开」：TCP 死了但无 close（仅停止收发）；B 进程已消失，停止任何广播
    ;(b.provider.ws as unknown as MockWebSocket).serverOpen = false
    b.provider.awareness.setLocalState(null as any)

    // 等过 awarenessTimeout（A 的心跳定时器会过期清除陈旧 B）
    await flush(160)

    expect(a.provider.awareness.getStates().has(bId)).toBe(false)

    a.provider.destroy()
    b.provider.destroy()
  })

  it('[健壮性] 心跳探活：半开连接被检测并重连恢复（最终收到对端编辑）', async () => {
    const a = makeClient(undefined, { pingInterval: 20 })
    const b = makeClient()
    openAll()
    await flush()
    a.doc.append(new Node({ name: 'base' }))
    await flush()
    expect(childIds(b.doc).length).toBe(1)

    // A 的连接半开：服务端不再投递给 A，也不触发 close（TCP 黑洞）
    const aWs = a.provider.ws as unknown as MockWebSocket
    aWs.serverOpen = false
    aWs.hubRoom?.conns.delete(aWs)

    // B 继续编辑
    b.doc.append(new Node({ name: 'afterHalfOpen' }))

    // 心跳应在 ~2 个间隔内判定 A 已死 → close → 重连。等待后打开重连的新连接。
    await flush(80)
    openAll()
    await flush()

    expect(a.provider.connected).toBe(true)
    expect(childIds(a.doc).length).toBe(2)

    a.provider.destroy()
    b.provider.destroy()
  })

  it('[健壮性] _pending 有上界：长时间离线编辑不无界堆积，重连后全量补推不丢', async () => {
    const a = makeClient(undefined, { maxPendingMessages: 32 })
    const b = makeClient()
    openAll()
    await flush()

    hub.dropClient(a.provider.ws as unknown as MockWebSocket)
    await flush()

    const ids: string[] = []
    for (let i = 0; i < 300; i++) {
      const n = new Node({ name: `x${i}` })
      ids.push(n.id)
      a.doc.append(n)
    }
    await flush()

    // 缓冲有上界
    expect((a.provider as any)._pending.length).toBeLessThanOrEqual(32)
    expect((a.provider as any)._droppedPending).toBe(true)

    // 重连：onopen 会 broadcastState 全量补推 → B 收到所有离线编辑（不丢）
    await flush(40)
    openAll()
    await flush()
    for (const id of ids) {
      expect(b.doc.findOne((x: any) => x.id === id)).toBeTruthy()
    }

    a.provider.destroy()
    b.provider.destroy()
  })
})

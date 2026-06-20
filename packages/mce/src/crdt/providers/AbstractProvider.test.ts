import { describe, expect, it } from 'vitest'
import { Doc } from '../../scene/Doc'
import { AbstractProvider } from './AbstractProvider'

/**
 * 内存传输：把 send 直接转给对端 receive，模拟一条无损链路。
 * 用于在无网络的情况下验证 AbstractProvider 的握手 / sync / awareness 协议。
 */
class MemoryProvider extends AbstractProvider {
  peer?: MemoryProvider

  protected send(data: Uint8Array): void {
    // 拷一份，避免共享底层 buffer 被后续编码复用。
    this.peer?.receive(data.slice())
  }

  /** 模拟连接建立：发起握手 + 广播 awareness。 */
  open(): void {
    this.onOpen()
  }
}

function pair(a: Doc, b: Doc): [MemoryProvider, MemoryProvider] {
  const pa = new MemoryProvider(a._yDoc)
  const pb = new MemoryProvider(b._yDoc)
  pa.peer = pb
  pb.peer = pa
  return [pa, pb]
}

describe('abstractProvider 同步协议', () => {
  it('onOpen 交换 state vector 后两端 synced 置位', () => {
    const a = new Doc([])
    const b = new Doc([])
    const [pa, pb] = pair(a, b)

    pa.open()
    pb.open()

    expect(pa.synced).toBe(true)
    expect(pb.synced).toBe(true)

    pa.destroy()
    pb.destroy()
  })

  it('本地结构增量经 provider 单向同步到对端（远端回放不回环）', () => {
    const a = new Doc([])
    const b = new Doc([])
    const [pa, pb] = pair(a, b)

    pa.open()
    pb.open()

    // 纯同步内存链路：若远端 apply 的内部回放（_proxyNode 补 parentId 等）以 null-origin 回传，
    // 这里会无限递归栈溢出。INTERNAL_ORIGIN 包裹 + provider 跳过 INTERNAL 后应正常收敛。
    a.append([{ meta: { inEditorIs: 'Element' }, name: 'fromA' } as any])

    expect(b.children.map(c => c.name)).toContain('fromA')

    pa.destroy()
    pb.destroy()
  })

  it('撤销经 provider 同步到对端（origin=UndoManager 照常广播）', () => {
    const a = new Doc([])
    const b = new Doc([])
    const [pa, pb] = pair(a, b)

    pa.open()
    pb.open()

    a.append([{ meta: { inEditorIs: 'Element' }, name: 'undoable' } as any])
    expect(b.children.map(c => c.name)).toContain('undoable')

    a.undo()

    expect(b.children.map(c => c.name)).not.toContain('undoable')

    pa.destroy()
    pb.destroy()
  })

  it('对端在整合新建节点后继续编辑，创建端无因果缺口正常同步（回归）', () => {
    const a = new Doc([])
    const b = new Doc([])
    const [pa, pb] = pair(a, b)

    pa.open()
    pb.open()

    // A 新建节点。B 整合时 _proxyNode 会跑 parentId 回写路径。
    // 回归点：该回写若在 INTERNAL 事务里生成真实 yjs 结构（推进 B 的 clock）却因 INTERNAL 不广播，
    // B 之后任何 LOCAL 编辑都依赖 A 永远收不到的 clock → A 整段挂起(pendingStructs)同步卡死。
    a.append([{ meta: { inEditorIs: 'Element' }, name: 'fromA' } as any])
    expect(b.children.map(c => c.name)).toContain('fromA')

    // B 在整合 A 的节点之后继续做本地编辑（新增自己的节点）。
    b.append([{ meta: { inEditorIs: 'Element' }, name: 'fromB' } as any])

    // 创建端 A 应无缺口地收到 B 的新增；两端 store 均无挂起结构。
    expect(a.children.map(c => c.name)).toContain('fromB')
    expect(a._yDoc._yDoc.store.pendingStructs).toBeFalsy()
    expect(b._yDoc._yDoc.store.pendingStructs).toBeFalsy()

    pa.destroy()
    pb.destroy()
  })
})

describe('abstractProvider awareness 在场感知', () => {
  it('本端 setLocalStateField 后对端 getStates 可见', () => {
    const a = new Doc([])
    const b = new Doc([])
    const [pa, pb] = pair(a, b)

    pa.open()
    pb.open()

    pa.awareness.setLocalStateField('user', { name: 'Alice', color: '#f00' })

    const seenByB = pb.awareness.getStates().get(a._yDoc._yDoc.clientID)
    expect(seenByB?.user).toEqual({ name: 'Alice', color: '#f00' })

    pa.destroy()
    pb.destroy()
  })

  it('change 事件在收到对端 awareness 时触发', () => {
    const a = new Doc([])
    const b = new Doc([])
    const [pa, pb] = pair(a, b)

    pa.open()
    pb.open()

    let changed = false
    pb.awareness.on('change', () => {
      changed = true
    })

    pa.awareness.setLocalStateField('cursor', { x: 10, y: 20 })

    expect(changed).toBe(true)
    expect(
      pb.awareness.getStates().get(a._yDoc._yDoc.clientID)?.cursor,
    ).toEqual({ x: 10, y: 20 })

    pa.destroy()
    pb.destroy()
  })

  it('destroy 后广播离场，对端清除本端状态', () => {
    const a = new Doc([])
    const b = new Doc([])
    const [pa, pb] = pair(a, b)

    pa.open()
    pb.open()

    const aClientId = a._yDoc._yDoc.clientID
    pa.awareness.setLocalStateField('user', { name: 'Alice' })
    expect(pb.awareness.getStates().has(aClientId)).toBe(true)

    pa.destroy()

    expect(pb.awareness.getStates().has(aClientId)).toBe(false)

    pb.destroy()
  })
})

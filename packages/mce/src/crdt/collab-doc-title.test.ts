import { setCanvasFactory } from 'modern-canvas'
import { describe, expect, it } from 'vitest'
import { Doc } from '../scene/Doc'

// 同 collab.test.ts：Node 环境注入零依赖 stub canvas。
setCanvasFactory((width = 1, height = 1) => ({
  width,
  height,
  getContext: () => null,
  style: {},
  addEventListener() {},
  removeEventListener() {},
}) as any)

const REMOTE = 'remote'

/** 两端实时链路（sync step1/2 + 增量转发，REMOTE 不回环）。 */
function link(a: Doc, b: Doc): void {
  b._yDoc.applyUpdate(a._yDoc.encodeStateAsUpdate(), REMOTE)
  a._yDoc.applyUpdate(b._yDoc.encodeStateAsUpdate(), REMOTE)
  a.on('update', (u, o) => o !== REMOTE && b._yDoc.applyUpdate(u, REMOTE))
  b.on('update', (u, o) => o !== REMOTE && a._yDoc.applyUpdate(u, REMOTE))
}

/** N 端星型中继：任一端本地增量广播到其余端（暴露两端测不出的多端收敛问题）。 */
function mesh(...docs: Doc[]): void {
  for (const d of docs) {
    for (const o of docs) {
      if (o !== d)
        d._yDoc.applyUpdate(o._yDoc.encodeStateAsUpdate(), REMOTE)
    }
  }
  for (const d of docs) {
    d.on('update', (u, o) => {
      if (o !== REMOTE) {
        for (const other of docs) {
          if (other !== d)
            other._yDoc.applyUpdate(u, REMOTE)
        }
      }
    })
  }
}

const flush = (): Promise<void> => new Promise(resolve => setTimeout(resolve, 0))

describe('协同：文档标题（root 顶层 name）', () => {
  // 回归：文档标题曾被当作「随客户端」的本地配置无条件写入同一个 _yProps.name key，
  // root 顶层 props 又无 isMeta 对账 → 两端并发写按随机 clientID 做 LWW，加入方的默认标题
  // 可能胜出、把房主真实标题冲成 'Doc'（同一文档多人协同「文档标题错乱」的真因）。
  it('加入方未配标题时，采纳房主标题，不用默认 Doc 覆盖', async () => {
    const host = new Doc([], { name: 'DesignByAlice' })
    const joiner = new Doc([]) // 未配 docName → 本地默认 'Doc'

    link(host, joiner)
    await flush()

    expect(host.name).toBe('DesignByAlice')
    expect(joiner.name).toBe('DesignByAlice')
  })

  it('两端各带不同标题时也收敛一致（不再是随机 clientID 决定的不确定态）', async () => {
    const a = new Doc([], { name: 'TitleA' })
    const b = new Doc([], { name: 'TitleB' })

    link(a, b)
    await flush()

    // 两端各自显式设了标题属于真并发编辑，CRDT 收敛到其一即可——关键是「一致」。
    expect(a.name).toBe(b.name)
  })

  it('房主运行中重命名，对端同步到新标题', async () => {
    const host = new Doc([], { name: 'Old' })
    const joiner = new Doc([])
    link(host, joiner)
    await flush()
    expect(joiner.name).toBe('Old')

    host.name = 'Renamed'
    await flush()
    expect(joiner.name).toBe('Renamed')
  })

  it('三端 mesh：仅房主配标题，全体收敛到房主标题', async () => {
    const host = new Doc([], { name: 'TeamDoc' })
    const j1 = new Doc([])
    const j2 = new Doc([])

    mesh(host, j1, j2)
    await flush()

    expect(host.name).toBe('TeamDoc')
    expect(j1.name).toBe('TeamDoc')
    expect(j2.name).toBe('TeamDoc')
  })
})

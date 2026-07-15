import { Element2D, Node, setCanvasFactory } from 'modern-canvas'
import { describe, expect, it } from 'vitest'
import { Doc } from '../scene/Doc'

// 同 YDoc.test.ts：纯 Node 环境注入零依赖 stub canvas，渲染相关取 context 返回 null 优雅早返回。
setCanvasFactory((width = 1, height = 1) => ({
  width,
  height,
  getContext: () => null,
  style: {},
  addEventListener() {},
  removeEventListener() {},
}) as any)

const REMOTE = 'remote'

/** 两端实时链路（等价 sync step1/2 + 增量转发，REMOTE 不回环）。 */
function link(a: Doc, b: Doc): void {
  b._yDoc.applyUpdate(a._yDoc.encodeStateAsUpdate(), REMOTE)
  a._yDoc.applyUpdate(b._yDoc.encodeStateAsUpdate(), REMOTE)
  a.on('update', (u, o) => o !== REMOTE && b._yDoc.applyUpdate(u, REMOTE))
  b.on('update', (u, o) => o !== REMOTE && a._yDoc.applyUpdate(u, REMOTE))
}

/**
 * N 端星型 / 服务端中继拓扑：任一端的本地增量广播到其余所有端（以 REMOTE apply，不再二次广播）。
 * 这是真实协同服务器的中继模型，可暴露纯两端测试发现不了的多端收敛问题。
 */
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

function tree(node: Node): any[] {
  return node.children.map(c => ({ id: c.id, children: tree(c) }))
}
function childIds(node: Node): string[] {
  return node.children.map(c => c.id)
}
function find(doc: Doc, id: string): any {
  return doc.findOne((n: any) => n.id === id)
}

describe('协同：元素属性 / 位置值同步', () => {
  it('移动元素（style.left/top）同步到对端', async () => {
    const a = new Doc([])
    const b = new Doc([])
    link(a, b)

    const el = new Element2D()
    a.append(el)
    await flush()

    el.style.setProperties({ left: 100, top: 60 })
    await flush()

    const remote = find(b, el.id)
    expect(remote.style.left).toBe(100)
    expect(remote.style.top).toBe(60)

    a.destroy()
    b.destroy()
  })

  it('多个子对象（text/fill/outline/shadow）一次性改动全部同步', async () => {
    const a = new Doc([])
    const b = new Doc([])
    link(a, b)

    const el = new Element2D()
    a.append(el)
    await flush()

    el.text.setProperties({ content: 'hello' })
    el.fill.setProperties({ color: '#ff0000' })
    el.outline.setProperties({ color: '#00ff00', width: 2 })
    el.shadow.setProperties({ color: '#000000', blur: 4 })
    await flush()

    // 断言「远端 == 本端」（值经引擎归一化，如 color 补 alpha；比对本端避免硬编码 schema）
    const r = find(b, el.id)
    expect(r.fill.toJSON()).toEqual(el.fill.toJSON())
    expect(r.outline.toJSON()).toEqual(el.outline.toJSON())
    expect(r.shadow.toJSON()).toEqual(el.shadow.toJSON())
    expect(r.text.toJSON()).toEqual(el.text.toJSON())

    a.destroy()
    b.destroy()
  })
})

describe('协同：同一元素的并发属性编辑', () => {
  it('两端改同一元素的不同属性 → 两者都保留', async () => {
    const a = new Doc([])
    const b = new Doc([])
    link(a, b)

    const el = new Element2D()
    a.append(el)
    await flush()

    const ra = find(a, el.id)
    const rb = find(b, el.id)
    // 并发：a 改 left，b 改 top（不同键，LWW 互不覆盖）
    ra.style.setProperties({ left: 200 })
    rb.style.setProperties({ top: 150 })
    await flush()

    for (const d of [a, b]) {
      const r = find(d, el.id)
      expect(r.style.left).toBe(200)
      expect(r.style.top).toBe(150)
    }

    a.destroy()
    b.destroy()
  })

  it('两端改同一元素的同一属性 → 收敛到同一值（确定性）', async () => {
    const a = new Doc([])
    const b = new Doc([])
    link(a, b)

    const el = new Element2D()
    a.append(el)
    await flush()

    find(a, el.id).style.setProperties({ left: 10 })
    find(b, el.id).style.setProperties({ left: 20 })
    await flush()

    const la = find(a, el.id).style.left
    const lb = find(b, el.id).style.left
    expect(la).toBe(lb) // 两端一致（具体胜者由 Yjs client id 决定，这里只要求收敛）
    expect([10, 20]).toContain(la)

    a.destroy()
    b.destroy()
  })
})

describe('协同：结构 / 层级', () => {
  it('跨父节点移动（reparent）同步', async () => {
    const a = new Doc([])
    const b = new Doc([])
    link(a, b)

    const p1 = new Node({ name: 'p1' })
    const p2 = new Node({ name: 'p2' })
    const child = new Node({ name: 'child' })
    a.append(p1)
    a.append(p2)
    p1.append(child)
    await flush()
    expect(childIds(find(b, p1.id))).toEqual([child.id])

    // 移到 p2 下
    find(a, p2.id).append(find(a, child.id))
    await flush()

    expect(childIds(find(b, p1.id))).toEqual([])
    expect(childIds(find(b, p2.id))).toEqual([child.id])
    expect(tree(a)).toEqual(tree(b))

    a.destroy()
    b.destroy()
  })

  it('两端并发把同一节点移到不同 index → 收敛到同一顺序', async () => {
    const a = new Doc([])
    const b = new Doc([])
    link(a, b)

    const nodes = Array.from({ length: 4 }, (_, i) => new Node({ name: `n${i}` }))
    nodes.forEach(n => a.append(n))
    await flush()

    a.moveChild(find(a, nodes[0].id), 3)
    b.moveChild(find(b, nodes[3].id), 0)
    await flush()

    expect(childIds(a)).toEqual(childIds(b)) // 收敛即可
    // 集合不丢节点
    expect([...childIds(a)].sort()).toEqual(nodes.map(n => n.id).sort())

    a.destroy()
    b.destroy()
  })

  it('一端删节点、另一端并发改该节点属性 → 不崩且两端一致', async () => {
    const a = new Doc([])
    const b = new Doc([])
    link(a, b)

    const el = new Element2D()
    a.append(el)
    await flush()

    // a 删除，b 并发改属性
    find(a, el.id).remove()
    find(b, el.id).style.setProperties({ left: 999 })
    await flush()

    expect(childIds(a)).toEqual(childIds(b))
    expect(() => a._yDoc.encodeStateAsUpdate()).not.toThrow()
    expect(() => b._yDoc.encodeStateAsUpdate()).not.toThrow()

    a.destroy()
    b.destroy()
  })
})

describe('协同：三端（服务端中继拓扑）', () => {
  it('三端各自编辑都广播到其余两端并收敛', async () => {
    const a = new Doc([])
    const b = new Doc([])
    const c = new Doc([])
    mesh(a, b, c)

    const na = new Node({ name: 'a' })
    const nb = new Node({ name: 'b' })
    const nc = new Node({ name: 'c' })
    a.append(na)
    b.append(nb)
    c.append(nc)
    await flush()

    const ids = [na.id, nb.id, nc.id].sort()
    expect([...childIds(a)].sort()).toEqual(ids)
    expect([...childIds(b)].sort()).toEqual(ids)
    expect([...childIds(c)].sort()).toEqual(ids)
    expect(childIds(a)).toEqual(childIds(b))
    expect(childIds(b)).toEqual(childIds(c))

    a.destroy()
    b.destroy()
    c.destroy()
  })

  it('三端并发改同一元素同一属性 → 三端收敛到同一值', async () => {
    const a = new Doc([])
    const b = new Doc([])
    const c = new Doc([])
    mesh(a, b, c)

    const el = new Element2D()
    a.append(el)
    await flush()

    find(a, el.id).style.setProperties({ left: 1 })
    find(b, el.id).style.setProperties({ left: 2 })
    find(c, el.id).style.setProperties({ left: 3 })
    await flush()

    const va = find(a, el.id).style.left
    expect(find(b, el.id).style.left).toBe(va)
    expect(find(c, el.id).style.left).toBe(va)
    expect([1, 2, 3]).toContain(va)

    a.destroy()
    b.destroy()
    c.destroy()
  })
})

describe('协同：离线编辑 + 重连合并', () => {
  it('两端断网各自编辑，重连交换状态后收敛（不丢改动）', async () => {
    // 不建实时链路，模拟离线
    const a = new Doc([])
    const b = new Doc([])
    // 先共享一个公共起点
    const base = new Node({ name: 'base' })
    a.append(base)
    b._yDoc.applyUpdate(a._yDoc.encodeStateAsUpdate(), REMOTE)
    await flush()
    expect(childIds(b)).toEqual([base.id])

    // 离线各自加节点
    const offA = new Node({ name: 'offA' })
    const offB = new Node({ name: 'offB' })
    a.append(offA)
    b.append(offB)
    await flush()

    // 重连：双向全量交换
    b._yDoc.applyUpdate(a._yDoc.encodeStateAsUpdate(), REMOTE)
    a._yDoc.applyUpdate(b._yDoc.encodeStateAsUpdate(), REMOTE)
    await flush()

    expect([...childIds(a)].sort()).toEqual([base.id, offA.id, offB.id].sort())
    expect(childIds(a)).toEqual(childIds(b))

    a.destroy()
    b.destroy()
  })
})

describe('协同：文档内容整体替换（模拟切档复用共享 Doc）', () => {
  it('一端 set({children}) 整体替换 → 对端收敛到新内容', async () => {
    const a = new Doc([])
    const b = new Doc([])
    link(a, b)

    a.append(new Node({ name: 'old1' }))
    a.append(new Node({ name: 'old2' }))
    await flush()
    expect(childIds(b).length).toBe(2)

    // 模拟 doc.ts setDoc 协同分支：transact(LOCAL) 内 reset+重填
    const fresh = [new Node({ name: 'new1' }), new Node({ name: 'new2' }), new Node({ name: 'new3' })]
    a.transact(() => a.set({ children: fresh } as any), true)
    await flush()

    expect(childIds(a).length).toBe(3)
    expect(childIds(b)).toEqual(childIds(a))
    expect(tree(b)).toEqual(tree(a))

    a.destroy()
    b.destroy()
  })
})

describe('协同：表格 / 评论子对象', () => {
  it('table 子对象属性同步到对端', async () => {
    const a = new Doc([])
    const b = new Doc([])
    link(a, b)

    const el = new Element2D()
    a.append(el)
    await flush()

    // table schema：columns/rows/cells 均为数组（见 modern-idoc normalizeTable）
    el.table.setProperties({
      columns: [{ width: 100 }, { width: 100 }],
      rows: [{ height: 30 }, { height: 30 }],
      cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }],
    } as any)
    await flush()

    const r = find(b, el.id)
    expect(r.table.toJSON()).toEqual(el.table.toJSON())
    expect(r.table.rows.length).toBe(2)
    expect(r.table.cells.length).toBe(2)

    a.destroy()
    b.destroy()
  })

  it('comments 逐线程同步到对端（element.comments）', async () => {
    const a = new Doc([])
    const b = new Doc([])
    link(a, b)

    const el = new Element2D()
    a.append(el)
    await flush()

    // 同 @mce/comments：按线程 id 写入 element.comments，toJSON() 输出线程数组
    el.comments.setProperty('t1', {
      id: 't1',
      offset: { x: 5, y: 6 },
      resolved: false,
      messages: [{ id: 'm1', author: 'u1', body: 'hi', createdAt: 1 }],
    })
    await flush()

    const r = find(b, el.id)
    expect(r.comments.toJSON()).toEqual(el.comments.toJSON())
    expect(r.comments.toJSON()).toMatchObject([{ id: 't1', resolved: false }])

    // 再增一条线程 + resolve 第一条 → 增量逐线程同步
    el.comments.setProperty('t2', { id: 't2', offset: { x: 1, y: 2 }, resolved: false, messages: [] })
    el.comments.setProperty('t1', { ...(el.comments.toJSON() as any[])[0], resolved: true })
    await flush()
    expect(find(b, el.id).comments.toJSON()).toEqual(el.comments.toJSON())

    a.destroy()
    b.destroy()
  })

  it('comments 冷加载：评论先存在，后连端一次性 apply 全量状态仍可见（刷新回归）', async () => {
    // 复现「评论完保存后刷新，评论不见了」：评论写入后，全新端冷加载（applyUpdate 一次性灌入
    // 全量快照、无逐 key observe）。comments 是按线程 id 动态存键的子对象，其属性声明源自已存键，
    // 冷加载时内部存储尚空 → 若不按 yMap 实存键回灌，toJSON 读空、评论全丢。
    const a = new Doc([])
    const el = new Element2D()
    a.append(el)
    await flush()
    el.comments.setProperty('t1', {
      id: 't1',
      offset: { x: 5, y: 6 },
      resolved: false,
      messages: [{ id: 'm1', author: 'u1', body: 'hi', createdAt: 1 }],
    })
    await flush()

    // 全新端冷加载 a 的全量状态（等价 BOS 快照恢复 / 刷新后采纳服务端权威内容）
    const b = new Doc([])
    b._yDoc.applyUpdate(a._yDoc.encodeStateAsUpdate(), REMOTE)
    await flush()

    const r = find(b, el.id)
    expect(r).toBeTruthy()
    expect(r.comments.toJSON()).toEqual(el.comments.toJSON())
    expect(r.comments.toJSON()).toMatchObject([{ id: 't1', resolved: false }])

    a.destroy()
    b.destroy()
  })
})

import { Node } from 'modern-canvas'
import { describe, expect, it } from 'vitest'
import { Doc } from '../scene/Doc'

const REMOTE = 'remote'

/**
 * 建立一条「网络链路」：先交换全量状态（等价于 sync step1/step2 握手），再转发实时增量。
 * origin === REMOTE 的是刚 apply 进来的，不回传，避免回环。
 */
function link(a: Doc, b: Doc): void {
  b._yDoc.applyUpdate(a._yDoc.encodeStateAsUpdate(), REMOTE)
  a._yDoc.applyUpdate(b._yDoc.encodeStateAsUpdate(), REMOTE)
  a.on('update', (update, origin) => {
    if (origin !== REMOTE) {
      b._yDoc.applyUpdate(update, REMOTE)
    }
  })
  b.on('update', (update, origin) => {
    if (origin !== REMOTE) {
      a._yDoc.applyUpdate(update, REMOTE)
    }
  })
}

const flush = (): Promise<void> => new Promise(resolve => setTimeout(resolve, 0))

function tree(node: Node): any[] {
  return node.children.map(c => ({ id: c.id, name: c.name, children: tree(c) }))
}

function childIds(node: Node): string[] {
  return node.children.map(c => c.id)
}

describe('yDoc 两端最终一致性', () => {
  it('增 / 嵌套增 / 重排 / 删 后两端结构一致', async () => {
    const a = new Doc([])
    const b = new Doc([])
    link(a, b)

    const n1 = new Node({ name: 'n1' })
    const n2 = new Node({ name: 'n2' })
    a.append(n1)
    a.append(n2)
    await flush()
    expect(childIds(b)).toEqual([n1.id, n2.id])

    const c1 = new Node({ name: 'c1' })
    n1.append(c1)
    await flush()
    expect(tree(b)).toEqual(tree(a))

    a.moveChild(n2, 0)
    await flush()
    expect(childIds(a)).toEqual([n2.id, n1.id])
    expect(childIds(b)).toEqual(childIds(a))

    n1.remove()
    await flush()
    expect(childIds(b)).toEqual([n2.id])
    expect(tree(b)).toEqual(tree(a))

    a.destroy()
    b.destroy()
  })

  it('双向并发编辑收敛到同一结果', async () => {
    const a = new Doc([])
    const b = new Doc([])
    link(a, b)

    const na = new Node({ name: 'fromA' })
    const nb = new Node({ name: 'fromB' })
    a.append(na)
    b.append(nb)
    await flush()

    expect(childIds(a)).toEqual(childIds(b))
    expect([...childIds(a)].sort()).toEqual([na.id, nb.id].sort())

    a.destroy()
    b.destroy()
  })

  it('单 tick 内的密集改动经 mergeUpdates 合并后无丢失', async () => {
    const a = new Doc([])
    const b = new Doc([])
    link(a, b)

    const nodes = Array.from({ length: 20 }, (_, i) => new Node({ name: `m${i}` }))
    nodes.forEach(n => a.append(n))
    await flush()

    expect(childIds(a)).toEqual(nodes.map(n => n.id))
    expect(childIds(b)).toEqual(childIds(a))

    a.destroy()
    b.destroy()
  })
})

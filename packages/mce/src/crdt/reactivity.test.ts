import { Node } from 'modern-canvas'
import { describe, expect, it } from 'vitest'
import { isReactive } from 'vue'
import * as Y from 'yjs'
import { rawReactivity } from './reactivity'
import { YDoc } from './YDoc'

const REMOTE = 'remote'

interface Peer { ydoc: YDoc, root: Node }

function headless(id: string): Peer {
  const ydoc = new YDoc(id, rawReactivity)
  const root = new Node({ name: 'root' })
  ydoc._proxyRoot(root)
  return { ydoc, root }
}

function rawDoc(peer: Peer): Y.Doc {
  return (peer.ydoc as any)._yDoc
}

/** 先交换全量状态（握手），再转发实时增量，origin === REMOTE 不回传。 */
function link(a: Peer, b: Peer): void {
  Y.applyUpdate(rawDoc(b), Y.encodeStateAsUpdate(rawDoc(a)), REMOTE)
  Y.applyUpdate(rawDoc(a), Y.encodeStateAsUpdate(rawDoc(b)), REMOTE)
  a.ydoc.on('update', (u, origin) => {
    if (origin !== REMOTE)
      Y.applyUpdate(rawDoc(b), u, REMOTE)
  })
  b.ydoc.on('update', (u, origin) => {
    if (origin !== REMOTE)
      Y.applyUpdate(rawDoc(a), u, REMOTE)
  })
}

const ids = (n: Node): string[] => n.children.map(c => c.id)

/**
 * 验证解耦成果：YDoc 在「无 Vue 响应式」模式（rawReactivity）下可独立运行。
 * 两个 headless YDoc 互相 applyUpdate 仍结构收敛——证明 CRDT 核心已与 Vue 解耦、可脱离 Vue 测试。
 */
describe('crdt 响应式解耦', () => {
  it('rawReactivity 模式下节点不被 Vue 代理', () => {
    const a = headless('a')
    const child = new Node({ name: 'c' })
    a.root.append(child)
    expect(isReactive(a.root)).toBe(false)
    expect(isReactive(a.root.children[0])).toBe(false)
  })

  it('两个 headless YDoc 增 / 删 结构收敛', () => {
    const a = headless('a')
    const b = headless('b')
    link(a, b)

    const n1 = new Node({ name: 'n1' })
    const n2 = new Node({ name: 'n2' })
    a.root.append(n1)
    a.root.append(n2)
    expect(ids(b.root)).toEqual([n1.id, n2.id])

    n1.remove()
    expect(ids(b.root)).toEqual([n2.id])
  })
})

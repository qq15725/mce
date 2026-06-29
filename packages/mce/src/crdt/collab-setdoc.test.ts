import { Node, setCanvasFactory } from 'modern-canvas'
import { describe, expect, it } from 'vitest'
import * as Y from 'yjs'
import { Doc } from '../scene/Doc'

setCanvasFactory((width = 1, height = 1) => ({
  width,
  height,
  getContext: () => null,
  style: {},
  addEventListener() {},
  removeEventListener() {},
}) as any)

const REMOTE = 'remote'
const flush = (): Promise<void> => new Promise(resolve => setTimeout(resolve, 0))
const yArr = (d: Doc): string[] => (d._yDoc as any)._yChildrenIds.toArray()
const treeIds = (n: Node): string[] => n.children.map(c => c.id)

/** 权威服务端中继：模拟 collabDocHandler 的 Y.Doc。connect 时双向同步，之后增量转发。 */
class Server {
  ydoc = new Y.Doc()
  clients: Doc[] = []
  connect(c: Doc): void {
    c._yDoc.applyUpdate(Y.encodeStateAsUpdate(this.ydoc), REMOTE)
    Y.applyUpdate(this.ydoc, c._yDoc.encodeStateAsUpdate())
    c.on('update', (u, o) => {
      if (o === REMOTE)
        return
      Y.applyUpdate(this.ydoc, u)
      this.clients.forEach(o2 => o2 !== c && o2._yDoc.applyUpdate(u, REMOTE))
    })
    this.clients.push(c)
  }
}

describe('协同：set / setDoc 后 childrenIds 一致性（防 Length exceeded 回归）', () => {
  it('裸调 doc.set() 不重复子节点（origin=null observer 反馈循环回归）', async () => {
    const a = new Doc([])
    a.set({ children: [{ name: 'c1' }, { name: 'c2' }] } as any)
    await flush()
    // 修复前：tree/yArr 会变成 4（每个子节点重复一遍）
    expect(treeIds(a).length).toBe(2)
    expect(yArr(a)).toEqual(treeIds(a))
    a.destroy()
  })

  it('init 载入 Document → tree 与 childrenIds 一致', async () => {
    const a = new Doc({ meta: { inEditorIs: 'Doc' }, children: [{ name: 'c1' }, { name: 'c2' }] } as any)
    a.init()
    await flush()
    expect(treeIds(a).length).toBe(2)
    expect(yArr(a)).toEqual(treeIds(a))
    a.destroy()
  })

  it('发起方带内容连服务端 → 采纳方空 doc 加入收敛 → 双方编辑不抛 Length exceeded', async () => {
    const a = new Doc([])
    a.append(new Node({ name: 'c1' }))
    a.append(new Node({ name: 'c2' }))
    await flush()

    const server = new Server()
    server.connect(a)
    const b = new Doc([])
    b.init()
    server.connect(b)
    await flush()

    expect(treeIds(b)).toEqual(treeIds(a))

    let threw: any = null
    try {
      a.append(new Node({ name: 'c3' }))
    }
    catch (e) {
      threw = String(e)
    }
    await flush()
    expect(threw).toBeNull()
    expect(treeIds(b)).toEqual(treeIds(a))
    expect(treeIds(a).length).toBe(3)
    a.destroy()
    b.destroy()
  })

  it('嵌套结构（root→frame→els）协同：往 frame / root 加子节点均收敛不抛', async () => {
    const a = new Doc({
      meta: { inEditorIs: 'Doc' },
      children: [{ name: 'frame', children: [{ name: 'el1' }, { name: 'el2' }] }],
    } as any)
    a.init()
    await flush()

    const server = new Server()
    server.connect(a)
    const b = new Doc([])
    b.init()
    server.connect(b)
    await flush()

    const aFrame = a.children[0]!
    const bFrame = b.children[0]!
    expect(treeIds(bFrame)).toEqual(treeIds(aFrame))

    let threw: any = null
    try {
      aFrame.append(new Node({ name: 'el3' }))
      a.append(new Node({ name: 'top2' }))
    }
    catch (e) {
      threw = String(e)
    }
    await flush()
    expect(threw).toBeNull()
    expect(treeIds(bFrame)).toEqual(treeIds(aFrame))
    expect(treeIds(b)).toEqual(treeIds(a))
    a.destroy()
    b.destroy()
  })
})

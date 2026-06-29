import type { Node } from 'modern-canvas'
import { Element2D, setCanvasFactory } from 'modern-canvas'
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

// 真实作品（编辑器 getDoc 导出）：根下挂一个画板 Frame（inCanvasIs=Element2D / inEditorIs=Frame）。
const REAL_DOC = {
  id: '11258',
  name: 'Doc',
  style: { width: 1200, height: 1200, transformOrigin: 'left top', transform: 'scale(1)' },
  children: [{
    name: '画板',
    id: 'kphpmTDMvd',
    meta: { inCanvasIs: 'Element2D', inEditorIs: 'Frame', inPptIs: 'Slide' },
    style: { overflow: 'hidden', backgroundColor: '#fff', width: 1200, height: 1200, left: 0, top: 0 },
    background: { color: '#ffffffff', enabled: true },
  }],
  meta: { inPptIs: 'Pptx', inEditorIs: 'Doc', inCanvasIs: 'Element2D', startTime: 0, endTime: 0 },
}

const REMOTE = 'remote'
const flush = (): Promise<void> => new Promise(resolve => setTimeout(resolve, 0))
const yArr = (d: Doc): string[] => (d._yDoc as any)._yChildrenIds.toArray()
const treeIds = (n: Node): string[] => n.children.map(c => c.id)

/** 权威服务端中继：模拟协同服务端的 Y.Doc，connect 时双向同步，之后增量转发给其余 client。 */
class Server {
  ydoc = new Y.Doc()
  clients: Doc[] = []
  connect(c: Doc): void {
    c._yDoc.applyUpdate(Y.encodeStateAsUpdate(this.ydoc), REMOTE)
    Y.applyUpdate(this.ydoc, c._yDoc.encodeStateAsUpdate())
    c.on('update', (u, o) => {
      if (o === REMOTE) {
        return
      }
      Y.applyUpdate(this.ydoc, u)
      this.clients.forEach(o2 => o2 !== c && o2._yDoc.applyUpdate(u, REMOTE))
    })
    this.clients.push(c)
  }
}

describe('协同：真实作品（Frame 子节点）', () => {
  it('init 真实 doc → tree 与 childrenIds 一致', async () => {
    const a = new Doc(REAL_DOC as any)
    a.init()
    await flush()
    expect(yArr(a)).toEqual(treeIds(a))
    a.destroy()
  })

  it('载真实 doc → 连服务端 → 空 doc 端加入收敛 → 加 Element2D 不抛且两端一致', async () => {
    const a = new Doc(REAL_DOC as any)
    a.init()
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
      a.append(new Element2D())
    }
    catch (e) {
      threw = String(e)
    }
    await flush()
    expect(threw).toBeNull()
    expect(treeIds(b)).toEqual(treeIds(a))
    a.destroy()
    b.destroy()
  })
})

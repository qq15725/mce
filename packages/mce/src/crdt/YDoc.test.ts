import { Element2D, Node, setCanvasFactory } from 'modern-canvas'
import { describe, expect, it } from 'vitest'
import { Doc } from '../scene/Doc'
import { ELEMENT2D_SYNCED_SUBOBJECTS } from './YDoc'

// 纯 Node 测试环境无 DOM/canvas：Element2D 创建纹理画布、文字 update() 取 getContext 会崩。
// 注入一个零依赖 stub canvas，getContext 返回 null → modern-text/纹理逻辑优雅早返回（同步本身不依赖渲染）。
setCanvasFactory((width = 1, height = 1) => ({
  width,
  height,
  getContext: () => null,
  style: {},
  addEventListener() {},
  removeEventListener() {},
}) as any)

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

describe('yDoc undo/redo 与来源隔离', () => {
  it('本地编辑可撤销 / 重做，并同步到对端', async () => {
    const a = new Doc([])
    const b = new Doc([])
    link(a, b)

    const n = new Node({ name: 'u1' })
    a.append(n)
    await flush()
    expect(childIds(b)).toEqual([n.id])

    a._yDoc.undoManager.undo()
    await flush()
    expect(childIds(a)).toEqual([])
    expect(childIds(b)).toEqual([])

    a._yDoc.undoManager.redo()
    await flush()
    expect(childIds(a)).toEqual([n.id])
    expect(childIds(b)).toEqual([n.id])

    a.destroy()
    b.destroy()
  })

  it('远端变更不进入本端 undo 栈（撤销不会回退他人的编辑）', async () => {
    const a = new Doc([])
    const b = new Doc([])
    link(a, b)

    const n = new Node({ name: 'fromA' })
    a.append(n)
    await flush()
    expect(childIds(b)).toEqual([n.id])

    // b 上这条来自远端（REMOTE origin），不应被 b 的 UndoManager 跟踪。
    expect(b._yDoc.undoManager.canUndo()).toBe(false)
    b._yDoc.undoManager.undo() // no-op
    await flush()
    expect(childIds(b)).toEqual([n.id])
    expect(childIds(a)).toEqual([n.id])

    a.destroy()
    b.destroy()
  })
})

describe('yDoc Element2D 子对象 / 节点类型同步', () => {
  it('connection 子对象（连线起止/模式）会同步到对端', async () => {
    const a = new Doc([])
    const b = new Doc([])
    link(a, b)

    const el = new Element2D()
    el.connection.setProperties({ start: { id: 'x', idx: 0 }, end: { id: 'y', idx: 1 }, mode: 'orthogonal' })
    a.append(el)
    await flush()

    const remote: any = b.children.find(c => c.id === el.id)
    expect(remote?.connection.toJSON()).toEqual({
      start: { id: 'x', idx: 0 },
      end: { id: 'y', idx: 1 },
      mode: 'orthogonal',
    })

    // append 后再改也走访问器 → 同步
    el.connection.setProperties({ start: { id: 'x', idx: 0 }, end: { id: 'z', idx: 2 }, mode: 'curved' })
    await flush()
    expect(remote.connection.mode).toBe('curved')
    expect(remote.connection.end).toEqual({ id: 'z', idx: 2 })

    a.destroy()
    b.destroy()
  })

  it('非 Element2D 子节点（Animation）跨同步保留类型与专属属性', async () => {
    const a = new Doc([])
    const b = new Doc([])
    link(a, b)

    const el = new Element2D()
    const anim = Node.parse({
      is: 'Animation',
      loop: true,
      duration: 2000,
      keyframes: [{ offset: 0, left: 0 }, { offset: 1, left: 100 }],
    }) as Node
    el.append(anim)
    a.append(el)
    await flush()

    const remoteEl: any = b.children.find(c => c.id === el.id)
    const remoteAnim: any = remoteEl?.children[0]
    // 类型必须保留（否则被重建成普通 Node，keyframes 挂不上、动画失效）
    expect(remoteAnim?.is).toBe('Animation')
    expect(remoteAnim?.constructor.name).toBe(anim.constructor.name)
    expect(remoteAnim?.duration).toBe(2000)
    expect(remoteAnim?.loop).toBe(true)
    expect(remoteAnim?.keyframes?.length).toBe(2)

    a.destroy()
    b.destroy()
  })

  it('同步子对象列表与引擎 Element2D 子对象对齐（防漂移）', () => {
    const el = new Element2D()
    // 每一项都必须是 Element2D 上真实、可逐键代理的 CoreObject 子对象（catches 拼写/被引擎删除）。
    for (const key of ELEMENT2D_SYNCED_SUBOBJECTS) {
      const sub = (el as any)[key]
      expect(sub, `Element2D.${key} 应存在`).toBeTruthy()
      expect(typeof sub.offsetGetProperties, `Element2D.${key} 应是可代理 CoreObject`).toBe('function')
    }
    // 反向：填充各子对象后，toJSON 暴露的「对象型」键都应在同步列表内
    // （引擎新增可序列化子对象时此断言失败 → 提示在 ELEMENT2D_SYNCED_SUBOBJECTS 补列）。
    el.setProperties({
      style: { left: 1 },
      background: { color: '#000000' },
      fill: { color: '#ffffff' },
      outline: { color: '#000000', width: 1 },
      text: { content: 'x' },
      shadow: { color: '#000000', blur: 1 },
      connection: { start: { id: 'a', idx: 0 } },
    } as any)
    const json: any = el.toJSON()
    const objectKeys = Object.keys(json).filter(
      k => k !== 'meta' && json[k] && typeof json[k] === 'object',
    )
    for (const k of objectKeys) {
      expect(ELEMENT2D_SYNCED_SUBOBJECTS as readonly string[], `toJSON 暴露的子对象 ${k} 未纳入同步`).toContain(k)
    }
  })
})

describe('yDoc 快照恢复', () => {
  it('全量快照可重建出等价文档（模拟离线恢复 / 迟到入会）', async () => {
    const a = new Doc([])
    const n1 = new Node({ name: 'n1' })
    const n2 = new Node({ name: 'n2' })
    a.append(n1)
    a.append(n2)
    n1.append(new Node({ name: 'c1' }))
    await flush()

    const restored = new Doc([])
    restored._yDoc.applyUpdate(a._yDoc.encodeStateAsUpdate(), REMOTE)
    await flush()

    expect(childIds(restored)).toEqual(childIds(a))
    expect(tree(restored)).toEqual(tree(a))

    a.destroy()
    restored.destroy()
  })
})

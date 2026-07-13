import { Node, setCanvasFactory } from 'modern-canvas'
import { describe, expect, it } from 'vitest'
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
function link(a: Doc, b: Doc): void {
  b._yDoc.applyUpdate(a._yDoc.encodeStateAsUpdate(), REMOTE)
  a._yDoc.applyUpdate(b._yDoc.encodeStateAsUpdate(), REMOTE)
  a.on('update', (u, o) => o !== REMOTE && b._yDoc.applyUpdate(u, REMOTE))
  b.on('update', (u, o) => o !== REMOTE && a._yDoc.applyUpdate(u, REMOTE))
}
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
const meta = (d: Doc): any => (d as any).meta

// root.meta 内联为 _yProps 顶层 `meta:` 前缀标量键后，走与 name 相同的可靠标量 LWW：
// 不同属性天然并集、同属性收敛一致，根除了「每端各建 meta 子 map 被整块替换」的并发丢失。
describe('协同：root.meta 子对象同步', () => {
  it('房主 link 前设 meta，加入方读到', async () => {
    const a = new Doc([], { name: 'A' })
    const b = new Doc([])
    meta(a).setProperty('theme', 'dark')
    link(a, b)
    await flush()
    expect(meta(a).getProperty('theme')).toBe('dark')
    expect(meta(b).getProperty('theme')).toBe('dark')
  })

  it('加入方 link 前设 meta，房主读到（对称）', async () => {
    const a = new Doc([], { name: 'A' })
    const b = new Doc([])
    meta(b).setProperty('locale', 'zh')
    link(a, b)
    await flush()
    expect(meta(a).getProperty('locale')).toBe('zh')
    expect(meta(b).getProperty('locale')).toBe('zh')
  })

  it('两端初始各设不同 meta 属性 → 并集（都不丢）', async () => {
    const a = new Doc([], { name: 'A' })
    const b = new Doc([], { name: 'B' })
    meta(a).setProperty('fromA', 1)
    meta(b).setProperty('fromB', 2)
    link(a, b)
    await flush()
    expect(meta(a).getProperty('fromA')).toBe(1)
    expect(meta(a).getProperty('fromB')).toBe(2)
    expect(meta(b).getProperty('fromA')).toBe(1)
    expect(meta(b).getProperty('fromB')).toBe(2)
  })

  it('link 后运行时房主设 meta，加入方收到', async () => {
    const a = new Doc([], { name: 'A' })
    const b = new Doc([])
    link(a, b)
    await flush()
    meta(a).setProperty('runtime', 'hello')
    await flush()
    expect(meta(b).getProperty('runtime')).toBe('hello')
  })

  it('link 后运行时加入方设 meta，房主收到（双向）', async () => {
    const a = new Doc([], { name: 'A' })
    const b = new Doc([])
    link(a, b)
    await flush()
    meta(b).setProperty('fromJoiner', 'yo')
    await flush()
    expect(meta(a).getProperty('fromJoiner')).toBe('yo')
  })

  it('运行时删除 meta 属性，对端同步删除', async () => {
    const a = new Doc([], { name: 'A' })
    const b = new Doc([])
    link(a, b)
    meta(a).setProperty('temp', 'x')
    await flush()
    expect(meta(b).getProperty('temp')).toBe('x')
    meta(a).setProperty('temp', undefined)
    await flush()
    expect(meta(b).getProperty('temp')).toBeUndefined()
  })

  it('三端 mesh：各设不同 meta，全体并集收敛', async () => {
    const a = new Doc([], { name: 'A' })
    const b = new Doc([])
    const c = new Doc([])
    meta(a).setProperty('a', 1)
    meta(b).setProperty('b', 2)
    meta(c).setProperty('c', 3)
    mesh(a, b, c)
    await flush()
    for (const d of [a, b, c]) {
      expect(meta(d).getProperty('a')).toBe(1)
      expect(meta(d).getProperty('b')).toBe(2)
      expect(meta(d).getProperty('c')).toBe(3)
    }
  })

  it('meta 在 doc.toJSON() 序列化里无损（无前缀泄漏）', async () => {
    const a = new Doc([], { name: 'A' })
    meta(a).setProperty('foo', 'bar')
    const json = meta(a).toJSON()
    expect(json.foo).toBe('bar')
    expect(Object.keys(json).some(k => k.startsWith('meta:'))).toBe(false)
  })

  it('回归：普通子节点的 meta 仍正常同步', async () => {
    const a = new Doc([], { name: 'A' })
    const b = new Doc([])
    link(a, b)
    const n = new Node({ name: 'child' })
    ;(n as any).meta.setProperty('kind', 'special')
    a.append(n)
    await flush()
    const nb = b.findOne((x: any) => x.id === n.id) as any
    expect(nb).toBeTruthy()
    expect(nb.meta.getProperty('kind')).toBe('special')
  })
})

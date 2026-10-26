import type { Node } from 'modern-canvas'
import { Element2D, Obb2D, setCanvasFactory } from 'modern-canvas'
import { describe, expect, it, vi } from 'vitest'
import { Doc } from '../scene/Doc'
import selectionPlugin from './selection'

setCanvasFactory((width = 1, height = 1) => ({ width, height, getContext: () => null, style: {}, addEventListener() {}, removeEventListener() {} }) as any)

vi.mock('../components/ScrollToSelection.vue', () => ({ default: {} }))
vi.mock('../components/Selection.vue', () => ({ default: {} }))

const marquee = { left: 45, top: 40, width: 10, height: 20 }

function createNode(overrides: Record<string, any> = {}): any {
  return {
    isVisibleInTree: () => true,
    findAncestor: () => undefined,
    ...overrides,
  }
}

function createConnection(): any {
  return createNode({
    connection: {
      isValid: () => true,
      route: () => ({
        getControlPointRefs: () => [{ x: 0, y: 50 }, { x: 100, y: 50 }],
      }),
    },
  })
}

function runMarqueeSelect(children: any[]): any[] {
  const selection = { value: [] as any[] }
  const editor = {
    selection,
    selectionMarquee: { value: marquee },
    elementSelection: selection,
    root: { value: { children } },
    isFrameNode: () => false,
    getObb: (node: any) => new Obb2D(node.obb),
    globalToDrawboard: (point: any) => point,
    isLock: () => false,
  }
  const plugin = (selectionPlugin as any)(editor, {})
  plugin.commands.find((item: any) => item.command === 'marqueeSelect').handle(marquee)
  return selection.value
}

describe('框选连接线', () => {
  it('仅命中连接线时选中连接线', () => {
    const connection = createConnection()
    expect(runMarqueeSelect([connection])).toEqual([connection])
  })

  it('同时命中节点和连接线时只选节点', () => {
    const connection = createConnection()
    const node = createNode({ obb: { left: 45, top: 40, width: 10, height: 20 } })
    expect(runMarqueeSelect([connection, node])).toEqual([node])
  })
})

function groupFixture() {
  const root = new Doc()
  const selection = { value: [] as Element2D[] }
  const plugin = (selectionPlugin as any)({
    root: { value: root },
    selection,
    elementSelection: selection,
    addElement: (data: any, options: any) => {
      const node = root.proxyNode(new Element2D()) as Element2D
      node.setProperties(data)
      options.parent.moveChild(node, options.index)
      node.updateGlobalTransform()
      return node
    },
  }, {})
  const command = (name: string) => plugin.commands.find((item: any) => item.command === name).handle()
  const add = (parent: Node = root, style: Record<string, any> = {}, name = '图层') => {
    const node = root.proxyNode(new Element2D()) as Element2D
    node.setProperties({ name, style: { width: 100, height: 80, ...style } })
    parent.appendChild(node)
    node.updateGlobalTransform()
    return node
  }
  return { root, selection, command, add }
}

function world(node: Element2D) {
  node.updateGlobalTransform()
  return node.globalTransform.toJSON()
}

function expectWorld(node: Element2D, expected: ReturnType<typeof world>) {
  const actual = world(node)
  for (const key of ['a', 'b', 'c', 'd', 'tx', 'ty'] as const)
    expect(actual[key], key).toBeCloseTo(expected[key], 7)
}

describe('组合图层和画板', () => {
  it('逆序点选后仍按原图层顺序组合，节点及子树 ID 保持不变', () => {
    const f = groupFixture()
    const background = f.add()
    const frame = f.add(f.root, { left: 200, top: 400 }, '画板')
    const child = f.add(frame, { left: 20, top: 30 })
    const front = f.add(f.root, { left: 600, top: 20 }, '前景')
    const before = [frame, child, front].map(world)
    f.selection.value = [front, child, frame]
    f.command('groupSelection')
    const group = f.selection.value[0]
    expect(f.root.children.map(n => n.id)).toEqual([background.id, group.id])
    expect(group.children.map(n => n.id)).toEqual([frame.id, front.id])
    expect(frame.children.map(n => n.id)).toEqual([child.id])
    ;[frame, child, front].forEach((node, i) => expectWorld(node, before[i]))
    f.command('ungroupSelection')
    expect(f.root.children.map(n => n.id)).toEqual([background.id, frame.id, front.id])
    ;[frame, child, front].forEach((node, i) => expectWorld(node, before[i]))
  })

  it('跨父级组合采用共同父节点，保留旋转、缩放与画板滚动后的世界位置', () => {
    const f = groupFixture()
    const frame = f.add(f.root, { left: 200, top: 500, rotate: 25, scaleX: 1.5, scaleY: 0.8 })
    frame.contentOffset.set(20, 40)
    const nested = f.add(frame, { left: 30, top: 60, rotate: -30, transform: 'skewX(12deg)' })
    const front = f.add(f.root, { left: 800, top: -100, scaleX: -1.2 })
    const before = [nested, front].map(world)
    f.selection.value = [front, nested]
    f.command('groupSelection')
    const group = f.selection.value[0]
    expect(group.parent?.id).toBe(f.root.id)
    expect(group.children.map(n => n.id)).toEqual([nested.id, front.id])
    ;[nested, front].forEach((node, i) => expectWorld(node, before[i]))
    f.command('ungroupSelection')
    ;[nested, front].forEach((node, i) => expectWorld(node, before[i]))
  })

  it('组合一次撤销和重做后保留图层顺序、子树及世界坐标', () => {
    const f = groupFixture()
    const frame = f.add(f.root, { left: 100, top: 200, rotate: 18 }, '画板')
    const child = f.add(frame, { left: 20, top: 30 })
    const front = f.add(f.root, { left: 600, top: 100 })
    const before = [frame, child, front].map(world)
    f.root.clearHistory()
    f.selection.value = [front, frame]
    f.command('groupSelection')
    const groupId = f.selection.value[0].id
    f.root.undo()
    expect(f.root.children.map(n => n.id)).toEqual([frame.id, front.id])
    ;[frame, child, front].forEach((node, i) => expectWorld(node, before[i]))
    f.root.redo()
    const group = f.root.children.find(node => node.id === groupId)!
    expect(group.children.map(n => n.id)).toEqual([frame.id, front.id])
    ;[frame, child, front].forEach((node, i) => expectWorld(node, before[i]))
  })

  it('旋转父画板内部组合不改变子元素位置，移动组合会带动全部子元素', () => {
    const f = groupFixture()
    const frame = f.add(f.root, { left: 200, top: 500, rotate: 25, scaleX: 1.5, scaleY: 0.8 })
    const a = f.add(frame, { left: 30, top: 60, rotate: 45 })
    const b = f.add(frame, { left: 300, top: 160, scaleX: -1 })
    const before = [a, b].map(world)
    f.selection.value = [b, a]
    f.command('groupSelection')
    const group = f.selection.value[0]
    expect(group.parent?.id).toBe(frame.id)
    ;[a, b].forEach((node, i) => expectWorld(node, before[i]))
    group.style.left += 100
    group.updateGlobalTransform()
    ;[a, b].forEach((node, i) => {
      const moved = world(node)
      expect(moved.tx).not.toBeCloseTo(before[i].tx)
      expect(moved.ty).not.toBeCloseTo(before[i].ty)
    })
  })
})

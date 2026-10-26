import type { Node } from 'modern-canvas'
import { Element2D, setCanvasFactory } from 'modern-canvas'
import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { Doc } from '../scene/Doc'
import { createLayer } from './layer'

const harness = vi.hoisted(() => ({ provided: undefined as any, drag: undefined as any, root: undefined as any }))
vi.mock('vue', async original => ({
  ...await original<any>(),
  getCurrentInstance: () => ({}),
  provide: (_key: any, value: any) => { harness.provided = value },
}))
vi.mock('./editor', () => ({ useEditor: () => ({ root: { value: harness.root } }) }))
vi.mock('../utils', () => ({
  findChildrenWithProvide: () => [],
  addDragListener: (_e: any, options: any) => { harness.drag = options },
}))
setCanvasFactory((width = 1, height = 1) => ({ width, height, getContext: () => null, style: {}, addEventListener() {}, removeEventListener() {} }) as any)

function fixture() {
  const root = new Doc()
  harness.root = root
  createLayer()
  const add = (parent: Node, style: Record<string, any>) => {
    const node = root.proxyNode(new Element2D()) as Element2D
    node.setProperties({ style: { width: 100, height: 80, ...style } })
    parent.appendChild(node)
    node.updateGlobalTransform()
    harness.provided.register({}, { id: node.id, node: ref(node), dom: ref(), opened: ref(false) })
    return node
  }
  const drop = (from: Node, to: Node) => {
    harness.provided.onMousedown({}, from.id)
    harness.drag.start()
    harness.provided.droppingItemId.value = to.id
    harness.drag.end()
  }
  return { root, add, drop }
}

describe('图层列表跨画板拖拽', () => {
  it('拖到画板内图层旁时保持世界位置与旋转，并能一次撤销/重做', () => {
    const f = fixture()
    const frame = f.add(f.root, { left: 500, top: -300, rotate: 25, scaleX: 1.3, scaleY: 0.7 })
    frame.contentOffset.set(20, 30)
    const target = f.add(frame, { left: 40, top: 60 })
    const from = f.add(f.root, { left: 400, top: 20, rotate: -30, scaleX: -1.2 })
    const before = from.globalTransform.toJSON()
    f.root.clearHistory()
    f.drop(from, target)
    expect(from.parent?.id).toBe(frame.id)
    const after = from.globalTransform.toJSON()
    for (const key of ['a', 'b', 'c', 'd', 'tx', 'ty'] as const)
      expect(after[key]).toBeCloseTo(before[key], 7)
    f.root.undo()
    expect(from.parent?.id).toBe(f.root.id)
    from.updateGlobalTransform()
    for (const key of ['a', 'b', 'c', 'd', 'tx', 'ty'] as const)
      expect(from.globalTransform[key]).toBeCloseTo(before[key], 7)
    f.root.redo()
    expect(from.parent?.id).toBe(frame.id)
  })

  it('不允许把父图层拖入自己的子树', () => {
    const f = fixture()
    const frame = f.add(f.root, { left: 100 })
    const child = f.add(frame, { left: 20 })
    f.drop(frame, child)
    expect(frame.parent?.id).toBe(f.root.id)
    expect(child.parent?.id).toBe(frame.id)
  })
})

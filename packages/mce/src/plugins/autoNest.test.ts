import type { Element2D as Element } from 'modern-canvas'
import { Element2D, setCanvasFactory } from 'modern-canvas'
import { describe, expect, it, vi } from 'vitest'
import { Doc } from '../scene/Doc'
import autoNestPlugin from './autoNest'

setCanvasFactory((width = 1, height = 1) => ({
  width,
  height,
  getContext: () => null,
  style: {},
  addEventListener() {},
  removeEventListener() {},
}) as any)

function element(style: Record<string, any> = {}, type = 'Frame') {
  return new Element2D({ meta: { inEditorIs: type }, style: { width: 100, height: 80, ...style } } as any)
}

function fixture(frameStyle: Record<string, any> = {}) {
  const root = new Doc()
  const frame = element({ left: 500, top: 300, width: 800, height: 600, ...frameStyle })
  root.appendChild(frame)
  frame.updateGlobalTransform()
  let pointer = { x: -100, y: -100 }
  const selection: { value: Element[] } = { value: [] }
  const plugin = (autoNestPlugin as any)({
    root: { value: root },
    frames: { value: [frame] },
    elementSelection: selection,
    isElement: (node: any) => node instanceof Element2D,
    isFrameNode: (node: any) => node.meta?.inEditorIs === 'Frame',
    getGlobalPointer: () => pointer,
    exec: vi.fn(),
  }, {})
  const nest = plugin.commands.find((item: any) => item.command === 'nestIntoFrame').handle
  const inside = frame.toGlobal({ x: 400, y: 300 })
  return { root, frame, selection, plugin, inside, nest, point: (next: typeof pointer) => {
    pointer = next
  } }
}

function world(node: Element) {
  node.updateGlobalTransform()
  return node.globalTransform.toJSON()
}

function expectWorld(node: Element, expected: ReturnType<typeof world>) {
  const actual = world(node)
  for (const key of ['a', 'b', 'c', 'd', 'tx', 'ty'] as const)
    expect(actual[key], key).toBeCloseTo(expected[key], 7)
}

describe('autoNest 跨画板保持全局变换', () => {
  it.each([
    { rotate: 0 },
    { rotate: 28, scaleX: 1.5, scaleY: 0.7 },
    { rotate: -35, scaleX: -1.2, scaleY: 0.8 },
  ])('进入旋转或缩放画板后位置与外观不变：%j', (style) => {
    const f = fixture(style)
    const node = element({ left: 1700, top: -300, rotate: 32, scaleX: 1.4, scaleY: 0.9, transform: 'skewX(12deg)' })
    f.root.appendChild(node)
    const before = world(node)
    f.nest(node, { pointer: f.inside })
    expect(node.getParent()).toBe(f.frame)
    expectWorld(node, before)
  })

  it('从一个画板直接拖入另一个画板时保留全局变换', () => {
    const f = fixture({ rotate: -24, scaleX: 0.8, scaleY: 1.3 })
    const source = element({ left: -600, top: -500, rotate: 37, scaleX: 1.2, scaleY: 0.7 })
    f.root.appendChild(source)
    source.updateGlobalTransform()
    const node = element({ left: 40, top: 70, rotate: 19, transformOrigin: 'left top' }, 'Image')
    source.appendChild(node)
    const before = world(node)
    f.nest(node, { pointer: f.inside })
    expect(node.getParent()).toBe(f.frame)
    expectWorld(node, before)
  })

  it('滚动画板移入和移出都保留位置，重复移入不累计误差', () => {
    const f = fixture({ rotate: 27 })
    f.frame.contentOffset.set(35, 70)
    const node = element({ left: 1800, top: -200, rotate: 48 })
    f.root.appendChild(node)
    const before = world(node)
    for (let i = 0; i < 3; i++) {
      f.nest(node, { pointer: f.inside })
      expect(node.getParent()).toBe(f.frame)
      expectWorld(node, before)
      f.nest(node, { pointer: { x: -2000, y: -2000 } })
      expect(node.getParent()).toBe(f.root)
      expectWorld(node, before)
    }
  })

  it('实时拖动事件使用相同的换父级逻辑', () => {
    const f = fixture()
    const node = element({ left: -100, top: -100, rotate: 40 }, 'Image')
    f.root.appendChild(node)
    f.selection.value = [node]
    f.plugin.events.selectionTransformStarted({ handle: 'move', event: {} })
    node.style.left = f.inside.x
    node.style.top = f.inside.y
    const before = world(node)
    f.point(f.inside)
    f.plugin.events.selectionTransformed()
    expect(node.getParent()).toBe(f.frame)
    expectWorld(node, before)
    f.plugin.events.selectionTransformEnded()
  })

  it('工作流节点保持独立，不自动嵌入画板', () => {
    const f = fixture()
    const node = element({ left: 200, top: 300 }, 'WorkflowImage')
    f.root.appendChild(node)
    const before = world(node)
    f.nest(node, { pointer: f.inside })
    expect(node.getParent()).toBe(f.root)
    expectWorld(node, before)
  })
})

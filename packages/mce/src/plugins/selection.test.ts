import { Obb2D } from 'modern-canvas'
import { describe, expect, it, vi } from 'vitest'
import selectionPlugin from './selection'

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

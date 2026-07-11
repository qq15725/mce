import { describe, expect, it } from 'vitest'
import { buildWorkflowGraph } from './graph'

function node(id: string): any {
  return { id, connection: { isValid: () => false } }
}

function edge(startId: string, endId: string, id = `${startId}->${endId}`): any {
  return {
    id,
    connection: {
      isValid: () => true,
      start: { id: startId, idx: 1 },
      end: { id: endId, idx: 0 },
    },
  }
}

// a → b → c，b 另有一条到 d 的分支
function diamond(): any[] {
  return [
    node('a'),
    node('b'),
    node('c'),
    node('d'),
    edge('a', 'b'),
    edge('b', 'c'),
    edge('b', 'd'),
  ]
}

describe('buildWorkflowGraph', () => {
  it('separates nodes from connections and indexes both directions', () => {
    const g = buildWorkflowGraph(diamond())
    expect([...g.nodes.keys()]).toEqual(['a', 'b', 'c', 'd'])
    expect(g.edges).toHaveLength(3)
    expect(g.out.get('b')?.map(e => e.end.id)).toEqual(['c', 'd'])
    expect(g.in.get('c')?.map(e => e.start.id)).toEqual(['b'])
    expect(g.out.get('c')).toBeUndefined()
  })

  // connection.isValid() 只检查 id 字符串是否存在，删除节点后残留的边仍是 "valid" 的。
  it('drops edges whose endpoints no longer exist', () => {
    const g = buildWorkflowGraph([node('a'), node('b'), edge('a', 'b'), edge('a', 'ghost')])
    expect(g.edges).toHaveLength(1)
    expect(g.downstream('a')).toHaveLength(1)
  })

  it('walks downstream and upstream', () => {
    const g = buildWorkflowGraph(diamond())
    expect(g.downstream('a').map(n => n.id)).toEqual(['b', 'c', 'd'])
    expect(g.downstream('c')).toEqual([])
    expect(g.upstream('c').map(n => n.id)).toEqual(['b', 'a'])
  })

  it('answers reachability', () => {
    const g = buildWorkflowGraph(diamond())
    expect(g.hasPath('a', 'd')).toBe(true)
    expect(g.hasPath('d', 'a')).toBe(false)
    // 无自环时，节点到自身不算有路径
    expect(g.hasPath('a', 'a')).toBe(false)
  })

  it('topologically sorts a DAG', () => {
    const order = buildWorkflowGraph(diamond()).topoSort()!.map(n => n.id)
    expect(order[0]).toBe('a')
    expect(order.indexOf('b')).toBeLessThan(order.indexOf('c'))
    expect(order.indexOf('b')).toBeLessThan(order.indexOf('d'))
  })

  describe('cycles', () => {
    it('terminates and reports no topological order', () => {
      const g = buildWorkflowGraph([node('a'), node('b'), edge('a', 'b'), edge('b', 'a')])
      expect(g.downstream('a').map(n => n.id)).toEqual(['b'])
      expect(g.hasPath('b', 'a')).toBe(true)
      expect(g.topoSort()).toBeUndefined()
    })

    it('survives a self-loop', () => {
      const g = buildWorkflowGraph([node('a'), edge('a', 'a')])
      expect(g.downstream('a')).toEqual([])
      expect(g.hasPath('a', 'a')).toBe(true)
      expect(g.topoSort()).toBeUndefined()
    })
  })
})

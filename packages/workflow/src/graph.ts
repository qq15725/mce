import type { Element2D, Node } from 'modern-canvas'

export interface WorkflowAnchor {
  id: string
  idx?: number
}

export interface WorkflowEdge {
  /** 承载这条边的连线元素（与节点平级，可选中 / 可删除）。 */
  connection: Element2D
  start: WorkflowAnchor
  end: WorkflowAnchor
}

export interface WorkflowGraph {
  /** 节点 id → 元素，不含连线自身。 */
  nodes: Map<string, Element2D>
  /** 两端都能解析的边；悬空边（引用了已删除节点）在建图时被丢弃。 */
  edges: WorkflowEdge[]
  /** 出边 / 入边索引，key 为节点 id。 */
  out: Map<string, WorkflowEdge[]>
  in: Map<string, WorkflowEdge[]>
  /** 从 id 出发可达的全部节点（不含自身），按 BFS 序；带 visited 集合，成环也会终止。 */
  downstream: (id: string) => Element2D[]
  /** 能到达 id 的全部节点（不含自身）。 */
  upstream: (id: string) => Element2D[]
  /** 是否存在 from → to 的有向路径（from === to 时为 false，除非确有自环）。 */
  hasPath: (from: string, to: string) => boolean
  /** 拓扑序；图中有环时返回 undefined。 */
  topoSort: () => Element2D[] | undefined
}

/** 连线元素：带一个有效的 connection。其余顶层元素都是工作流节点。 */
export function isWorkflowConnection(el: any): el is Element2D {
  return Boolean(el?.connection?.isValid?.())
}

function push(map: Map<string, WorkflowEdge[]>, key: string, edge: WorkflowEdge): void {
  const list = map.get(key)
  if (list) {
    list.push(edge)
  }
  else {
    map.set(key, [edge])
  }
}

/**
 * 由一批同级元素（通常是 root.children）派生出邻接索引。
 *
 * 边不存在节点身上——连线是平级元素，靠 `connection.start/end` 的 `{ id, idx }`
 * 引用两端。这里做的是「一次 O(V+E) 扫描建派生索引」，而不是在节点上冗余存
 * in/out 列表：后者在协同并发下必然与连线元素本身不一致。
 */
export function buildWorkflowGraph(children: readonly Node[]): WorkflowGraph {
  const nodes = new Map<string, Element2D>()
  const connections: Element2D[] = []

  for (const child of children) {
    if (isWorkflowConnection(child)) {
      connections.push(child as Element2D)
    }
    else {
      nodes.set((child as Element2D).id, child as Element2D)
    }
  }

  const edges: WorkflowEdge[] = []
  const out = new Map<string, WorkflowEdge[]>()
  const inn = new Map<string, WorkflowEdge[]>()

  for (const connection of connections) {
    const { start, end } = (connection as any).connection
    // 悬空边：connection.isValid() 只检查 id 字符串是否存在，不检查目标是否还在树里。
    // 建图时按「两端都能解析」过滤，遍历结果因此永远不含幽灵节点。
    if (!start?.id || !end?.id || !nodes.has(start.id) || !nodes.has(end.id)) {
      continue
    }
    const edge: WorkflowEdge = { connection, start, end }
    edges.push(edge)
    push(out, start.id, edge)
    push(inn, end.id, edge)
  }

  function walk(from: string, index: Map<string, WorkflowEdge[]>, pick: (e: WorkflowEdge) => string): Element2D[] {
    const visited = new Set<string>([from])
    const result: Element2D[] = []
    const queue = [from]
    while (queue.length) {
      for (const edge of index.get(queue.shift()!) ?? []) {
        const next = pick(edge)
        if (visited.has(next)) {
          continue
        }
        visited.add(next)
        const node = nodes.get(next)
        if (node) {
          result.push(node)
          queue.push(next)
        }
      }
    }
    return result
  }

  function hasPath(from: string, to: string): boolean {
    const visited = new Set<string>()
    const queue = [from]
    while (queue.length) {
      for (const edge of out.get(queue.shift()!) ?? []) {
        if (edge.end.id === to) {
          return true
        }
        if (!visited.has(edge.end.id)) {
          visited.add(edge.end.id)
          queue.push(edge.end.id)
        }
      }
    }
    return false
  }

  // Kahn：反复取入度为 0 的节点。收不满全部节点说明剩下的都在环里。
  function topoSort(): Element2D[] | undefined {
    const degree = new Map<string, number>()
    for (const id of nodes.keys()) {
      degree.set(id, inn.get(id)?.length ?? 0)
    }
    const queue = [...degree].filter(([, d]) => d === 0).map(([id]) => id)
    const result: Element2D[] = []
    while (queue.length) {
      const id = queue.shift()!
      result.push(nodes.get(id)!)
      for (const edge of out.get(id) ?? []) {
        const left = degree.get(edge.end.id)! - 1
        degree.set(edge.end.id, left)
        if (left === 0) {
          queue.push(edge.end.id)
        }
      }
    }
    return result.length === nodes.size ? result : undefined
  }

  return {
    nodes,
    edges,
    out,
    in: inn,
    downstream: id => walk(id, out, e => e.end.id),
    upstream: id => walk(id, inn, e => e.start.id),
    hasPath,
    topoSort,
  }
}

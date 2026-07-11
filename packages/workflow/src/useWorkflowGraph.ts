import type { ComputedRef } from 'vue'
import type { WorkflowGraph } from './graph'
import { useEditor } from 'mce'
import { computed } from 'vue'
import { buildWorkflowGraph } from './graph'

/**
 * 工作流的邻接索引，随 root.children 变化重建（节点移动 / 缩放不触发重建）。
 *
 * ```ts
 * const graph = useWorkflowGraph()
 * graph.value.downstream(node.id)  // 该节点的全部下游
 * graph.value.topoSort()           // 执行顺序；有环时为 undefined
 * ```
 */
export function useWorkflowGraph(): ComputedRef<WorkflowGraph> {
  const { root } = useEditor()
  return computed(() => buildWorkflowGraph(root.value?.children ?? []))
}

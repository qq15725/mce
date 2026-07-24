import type { Element2D } from 'modern-canvas'
import type { ShapeConnectionPoint } from 'modern-idoc'

export interface WorkflowPort extends ShapeConnectionPoint {
  kind: 'input' | 'output'
}

/**
 * 某类工作流节点暴露的端口开关。缺省两者皆 `true`：
 * - `input`  = 可接收上游（作为别人的下游）；
 * - `output` = 可作为源（其输出接给别人的输入）。
 * 设 `output:false` 即「该类型不能作为其他节点的输入源」（如视频节点）；
 * 两者都 `false` 则该类型不参与连线。
 */
export interface WorkflowPortConfig {
  input?: boolean
  output?: boolean
}

// Left = input, right = output. `idx` is stable so a connection's `{ id, idx }`
// anchor always resolves to the same port (routing matches by the `idx` field,
// not array position).
export const INPUT_PORT: WorkflowPort = { idx: 0, x: 0, y: 0.5, ang: Math.PI, kind: 'input' }
export const OUTPUT_PORT: WorkflowPort = { idx: 1, x: 1, y: 0.5, ang: 0, kind: 'output' }

// Ports an element exposes in workflow mode, by priority:
//   1. custom `shape.connectionPoints` win — kind inferred from x (left = input,
//      right = output), so materialized defaults round-trip consistently;
//   2. workflow nodes (WorkflowText/Image/Video) get input + output (left + right),
//      unless `portsByType` disables one for that type (e.g. video output:false);
//   3. any other element only emits — a single output port on the right.
export function getWorkflowPorts(
  el: Element2D,
  portsByType?: Record<string, WorkflowPortConfig>,
): WorkflowPort[] {
  const custom = el.shape?.connectionPoints
  if (custom?.length)
    return custom.map(p => ({ ...p, kind: p.x < 0.5 ? 'input' : 'output' }))
  const inEditorIs = el.meta?.inEditorIs
  if (inEditorIs?.startsWith('Workflow')) {
    const type = inEditorIs.slice('Workflow'.length).toLowerCase()
    const cfg = portsByType?.[type]
    const ports: WorkflowPort[] = []
    if (cfg?.input !== false)
      ports.push(INPUT_PORT)
    if (cfg?.output !== false)
      ports.push(OUTPUT_PORT)
    return ports
  }
  return [OUTPUT_PORT]
}

// Strip the workflow-only `kind` down to what `shape.connectionPoints` stores.
export function toConnectionPoints(ports: WorkflowPort[]): ShapeConnectionPoint[] {
  return ports.map(({ idx, x, y, ang }) => ({ idx, x, y, ang }))
}

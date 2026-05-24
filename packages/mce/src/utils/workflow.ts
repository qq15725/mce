import type { Element2D } from 'modern-canvas'
import type { ShapeConnectionPoint } from 'modern-idoc'

export interface WorkflowPort extends ShapeConnectionPoint {
  kind: 'input' | 'output'
}

// Left = input, right = output. `idx` is stable so a connection's `{ id, idx }`
// anchor always resolves to the same port (routing matches by the `idx` field,
// not array position).
export const INPUT_PORT: WorkflowPort = { idx: 0, x: 0, y: 0.5, ang: Math.PI, kind: 'input' }
export const OUTPUT_PORT: WorkflowPort = { idx: 1, x: 1, y: 0.5, ang: 0, kind: 'output' }

// Ports an element exposes in workflow mode, by priority:
//   1. custom `shape.connectionPoints` win — kind inferred from x (left = input,
//      right = output), so materialized defaults round-trip consistently;
//   2. workflow nodes (WorkflowText/Image/Video) get input + output (left + right);
//   3. any other element only emits — a single output port on the right.
export function getWorkflowPorts(el: Element2D): WorkflowPort[] {
  const custom = el.shape?.connectionPoints
  if (custom?.length)
    return custom.map(p => ({ ...p, kind: p.x < 0.5 ? 'input' : 'output' }))
  if (el.meta?.inEditorIs?.startsWith('Workflow'))
    return [INPUT_PORT, OUTPUT_PORT]
  return [OUTPUT_PORT]
}

// Strip the workflow-only `kind` down to what `shape.connectionPoints` stores.
export function toConnectionPoints(ports: WorkflowPort[]): ShapeConnectionPoint[] {
  return ports.map(({ idx, x, y, ang }) => ({ idx, x, y, ang }))
}

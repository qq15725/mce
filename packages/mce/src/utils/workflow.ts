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

// Default ports an element exposes in workflow mode. Any element is connectable
// and gets input + output out of the box; specific kinds narrow this (a frame
// only emits). Extend the switch as more node kinds need bespoke ports.
export function getWorkflowPorts(el: Element2D): WorkflowPort[] {
  if (el.meta?.inEditorIs === 'Frame')
    return [OUTPUT_PORT]
  return [INPUT_PORT, OUTPUT_PORT]
}

// Strip the workflow-only `kind` down to what `shape.connectionPoints` stores.
export function toConnectionPoints(ports: WorkflowPort[]): ShapeConnectionPoint[] {
  return ports.map(({ idx, x, y, ang }) => ({ idx, x, y, ang }))
}

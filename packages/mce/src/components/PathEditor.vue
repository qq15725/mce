<script setup lang="ts">
import type { Element2D } from 'modern-canvas'
import type { Path2DCommand } from 'modern-path2d'
import { Path2D, svgPathCommandsToData, svgPathDataToCommands } from 'modern-path2d'
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue'
import { useEditor } from '../composables/editor'

const props = defineProps<{
  element: Element2D
  // Camera mapping (global -> drawboard px), same as Selection passes to Transform.
  scale: [number, number]
  offset: [number, number]
}>()

const emit = defineEmits<{ end: [] }>()

const editor = useEditor()
const { elementSelection } = editor

// Capture the target once; if selection moves elsewhere we exit instead of
// re-initialising for a different element.
const el = props.element
const svgRef = useTemplateRef<SVGSVGElement>('svgTpl')

type Field = 'xy' | 'cp1' | 'cp2'

// Working copy of every path's commands, expressed in GLOBAL canvas coordinates
// (a fixed edit space). The element box is derived from these on every edit.
const paths = ref<Path2DCommand[][]>([])
const originalPaths = el.shape.paths?.map(p => ({ ...p })) ?? []
const selected = ref<{ pi: number, ci: number } | null>(null)

function build(): void {
  const parsed = originalPaths.map(p => new Path2D(p.data))

  // Combined data-space bounding box (modern-canvas normalises the whole shape
  // by this box, then scales it to the element size).
  let dx = Infinity
  let dy = Infinity
  let dr = -Infinity
  let db = -Infinity
  for (const p of parsed) {
    const bb = p.getBoundingBox()
    dx = Math.min(dx, bb.left)
    dy = Math.min(dy, bb.top)
    dr = Math.max(dr, bb.left + bb.width)
    db = Math.max(db, bb.top + bb.height)
  }
  const dbw = dr - dx || 1
  const dbh = db - dy || 1
  const sx = el.size.x || 1
  const sy = el.size.y || 1

  const toGlobal = (x: number, y: number): { x: number, y: number } => {
    const local = { x: (x - dx) / dbw * sx, y: (y - dy) / dbh * sy }
    return el.globalTransform.apply(local)
  }

  paths.value = parsed.map((p) => {
    const cmds = svgPathDataToCommands(p.toData())
    for (const c of cmds) {
      const a = c as any
      if ('x' in a && 'y' in a) {
        const g = toGlobal(a.x, a.y)
        a.x = g.x
        a.y = g.y
      }
      if ('x1' in a) {
        const g = toGlobal(a.x1, a.y1)
        a.x1 = g.x
        a.y1 = g.y
      }
      if ('x2' in a) {
        const g = toGlobal(a.x2, a.y2)
        a.x2 = g.x
        a.y2 = g.y
      }
    }
    return cmds
  })
}

build()

function toScreen(x: number, y: number): { x: number, y: number } {
  return { x: x * props.scale[0] + props.offset[0], y: y * props.scale[1] + props.offset[1] }
}

function getField(cmd: any, field: Field): { x: number, y: number } {
  if (field === 'cp1')
    return { x: cmd.x1, y: cmd.y1 }
  if (field === 'cp2')
    return { x: cmd.x2, y: cmd.y2 }
  return { x: cmd.x, y: cmd.y }
}

function setField(cmd: any, field: Field, x: number, y: number): void {
  if (field === 'cp1') {
    cmd.x1 = x
    cmd.y1 = y
  }
  else if (field === 'cp2') {
    cmd.x2 = x
    cmd.y2 = y
  }
  else {
    cmd.x = x
    cmd.y = y
  }
}

interface Pt { x: number, y: number }
function lerp(a: Pt, b: Pt, t: number): Pt {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }
}
function dist(a: Pt, b: Pt): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}
function cubicAt(p0: Pt, p1: Pt, p2: Pt, p3: Pt, t: number): Pt {
  const u = 1 - t
  const a = u * u * u
  const b = 3 * u * u * t
  const c = 3 * u * t * t
  const d = t * t * t
  return {
    x: a * p0.x + b * p1.x + c * p2.x + d * p3.x,
    y: a * p0.y + b * p1.y + c * p2.y + d * p3.y,
  }
}

const anchors = computed(() => {
  const list: { pi: number, ci: number, x: number, y: number, sel: boolean }[] = []
  paths.value.forEach((cmds, pi) => {
    cmds.forEach((c, ci) => {
      const a = c as any
      if ('x' in a && 'y' in a) {
        const s = toScreen(a.x, a.y)
        list.push({ pi, ci, x: s.x, y: s.y, sel: selected.value?.pi === pi && selected.value?.ci === ci })
      }
    })
  })
  return list
})

const controls = computed(() => {
  const list: { pi: number, ci: number, field: Field, x: number, y: number, ax: number, ay: number }[] = []
  paths.value.forEach((cmds, pi) => {
    cmds.forEach((c, ci) => {
      const a = c as any
      const prev = cmds[ci - 1] as any
      if (a.type === 'C') {
        if (prev && 'x' in prev) {
          const s = toScreen(a.x1, a.y1)
          const p = toScreen(prev.x, prev.y)
          list.push({ pi, ci, field: 'cp1', x: s.x, y: s.y, ax: p.x, ay: p.y })
        }
        const s2 = toScreen(a.x2, a.y2)
        const p2 = toScreen(a.x, a.y)
        list.push({ pi, ci, field: 'cp2', x: s2.x, y: s2.y, ax: p2.x, ay: p2.y })
      }
      else if (a.type === 'Q') {
        const s = toScreen(a.x1, a.y1)
        const p = toScreen(a.x, a.y)
        list.push({ pi, ci, field: 'cp1', x: s.x, y: s.y, ax: p.x, ay: p.y })
      }
    })
  })
  return list
})

// Path outline in screen space — an invisible wide stroke that captures
// double-clicks for inserting a new anchor.
const screenPath = computed(() => {
  let d = ''
  for (const cmds of paths.value) {
    for (const c of cmds) {
      const a = c as any
      if (a.type === 'M' || a.type === 'L' || a.type === 'A') {
        const s = toScreen(a.x, a.y)
        d += `${a.type === 'M' ? 'M' : 'L'} ${s.x} ${s.y} `
      }
      else if (a.type === 'C') {
        const c1 = toScreen(a.x1, a.y1)
        const c2 = toScreen(a.x2, a.y2)
        const e = toScreen(a.x, a.y)
        d += `C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${e.x} ${e.y} `
      }
      else if (a.type === 'Q') {
        const cp = toScreen(a.x1, a.y1)
        const e = toScreen(a.x, a.y)
        d += `Q ${cp.x} ${cp.y} ${e.x} ${e.y} `
      }
      else if (a.type === 'Z') {
        d += 'Z '
      }
    }
  }
  return d
})

// Re-derive the element box + path data from the global working copy so the
// rendered shape (which always fills its bbox) stays consistent.
function commit(): void {
  const datas = paths.value.map(cmds => svgPathCommandsToData(cmds))
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const d of datas) {
    const bb = new Path2D(d).getBoundingBox()
    minX = Math.min(minX, bb.left)
    minY = Math.min(minY, bb.top)
    maxX = Math.max(maxX, bb.left + bb.width)
    maxY = Math.max(maxY, bb.top + bb.height)
  }
  if (!Number.isFinite(minX)) {
    return
  }
  const w = Math.max(1, maxX - minX)
  const h = Math.max(1, maxY - minY)

  let lx = minX
  let ly = minY
  const pt = el.getParent<Element2D>()?.globalTransform
  if (pt) {
    const p = pt.applyAffineInverse({ x: minX, y: minY })
    lx = p.x
    ly = p.y
  }
  el.style.left = lx
  el.style.top = ly
  el.style.width = w
  el.style.height = h
  el.shape.paths = originalPaths.map((p, i) => ({ ...p, data: datas[i] ?? p.data }))
}

// Points to move together: an anchor drags its attached bezier handles.
function dragGroup(pi: number, ci: number, field: Field): { cmd: any, field: Field }[] {
  const cmds = paths.value[pi]
  const cmd = cmds[ci] as any
  if (field !== 'xy') {
    return [{ cmd, field }]
  }
  const group: { cmd: any, field: Field }[] = [{ cmd, field: 'xy' }]
  if (cmd.type === 'C') {
    group.push({ cmd, field: 'cp2' })
  }
  const next = cmds[ci + 1] as any
  if (next && next.type === 'C') {
    group.push({ cmd: next, field: 'cp1' })
  }
  return group
}

let drag: { cx: number, cy: number, points: { cmd: any, field: Field, sx: number, sy: number }[] } | undefined

// Force a fresh undo group so a whole drag collapses into one history step.
function startCapture(): void {
  ;(editor.root.value as any).stopCapturing?.()
}

function onDown(e: PointerEvent, pi: number, ci: number, field: Field): void {
  e.stopPropagation()
  e.preventDefault()
  if (field === 'xy') {
    selected.value = { pi, ci }
  }
  startCapture()
  const points = dragGroup(pi, ci, field).map(({ cmd, field }) => {
    const v = getField(cmd, field)
    return { cmd, field, sx: v.x, sy: v.y }
  })
  drag = { cx: e.clientX, cy: e.clientY, points }
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
}

function onMove(e: PointerEvent): void {
  if (!drag)
    return
  const dx = (e.clientX - drag.cx) / props.scale[0]
  const dy = (e.clientY - drag.cy) / props.scale[1]
  for (const p of drag.points) {
    setField(p.cmd, p.field, p.sx + dx, p.sy + dy)
  }
  commit()
}

function onUp(): void {
  if (drag) {
    startCapture()
    drag = undefined
  }
  window.removeEventListener('pointermove', onMove)
  window.removeEventListener('pointerup', onUp)
}

// Insert an anchor on the nearest segment (line or cubic) under a double-click.
function onInsert(e: MouseEvent): void {
  e.stopPropagation()
  const rect = svgRef.value?.getBoundingClientRect()
  if (!rect)
    return
  const g: Pt = {
    x: (e.clientX - rect.left - props.offset[0]) / props.scale[0],
    y: (e.clientY - rect.top - props.offset[1]) / props.scale[1],
  }

  let best: { pi: number, ci: number, kind: 'L' | 'C', at: Pt, t: number, dist: number } | undefined
  paths.value.forEach((cmds, pi) => {
    cmds.forEach((c, ci) => {
      const a = c as any
      const prev = cmds[ci - 1] as any
      if (!prev || !('x' in prev)) {
        return
      }
      if (a.type === 'L') {
        const vx = a.x - prev.x
        const vy = a.y - prev.y
        const len2 = vx * vx + vy * vy || 1
        const t = Math.max(0, Math.min(1, ((g.x - prev.x) * vx + (g.y - prev.y) * vy) / len2))
        const at = { x: prev.x + t * vx, y: prev.y + t * vy }
        const d = dist(g, at)
        if (!best || d < best.dist) {
          best = { pi, ci, kind: 'L', at, t, dist: d }
        }
      }
      else if (a.type === 'C') {
        const p0 = { x: prev.x, y: prev.y }
        const p1 = { x: a.x1, y: a.y1 }
        const p2 = { x: a.x2, y: a.y2 }
        const p3 = { x: a.x, y: a.y }
        for (let i = 1; i < 24; i++) {
          const t = i / 24
          const at = cubicAt(p0, p1, p2, p3, t)
          const d = dist(g, at)
          if (!best || d < best.dist) {
            best = { pi, ci, kind: 'C', at, t, dist: d }
          }
        }
      }
    })
  })

  if (!best || best.dist * props.scale[0] >= 12) {
    return
  }

  const cmds = paths.value[best.pi]
  if (best.kind === 'L') {
    cmds.splice(best.ci, 0, { type: 'L', x: best.at.x, y: best.at.y } as Path2DCommand)
  }
  else {
    // Split the cubic at t (de Casteljau): existing command keeps the end point
    // and becomes the second half; insert the first half before it.
    const cur = cmds[best.ci] as any
    const prev = cmds[best.ci - 1] as any
    const t = best.t
    const p0 = { x: prev.x, y: prev.y }
    const p1 = { x: cur.x1, y: cur.y1 }
    const p2 = { x: cur.x2, y: cur.y2 }
    const p3 = { x: cur.x, y: cur.y }
    const q0 = lerp(p0, p1, t)
    const q1 = lerp(p1, p2, t)
    const q2 = lerp(p2, p3, t)
    const r0 = lerp(q0, q1, t)
    const r1 = lerp(q1, q2, t)
    const s = lerp(r0, r1, t)
    cur.x1 = r1.x
    cur.y1 = r1.y
    cur.x2 = q2.x
    cur.y2 = q2.y
    cmds.splice(best.ci, 0, { type: 'C', x1: q0.x, y1: q0.y, x2: r0.x, y2: r0.y, x: s.x, y: s.y } as Path2DCommand)
  }
  commit()
}

// Double-click an anchor to round it (straight -> smooth cubic tangents) or
// sharpen it (cubic -> straight). Needs both neighbours to compute a tangent.
function toggleSmooth(pi: number, ci: number): void {
  const cmds = paths.value[pi]
  const cur = cmds[ci] as any
  const out = cmds[ci + 1] as any
  const prev = cmds[ci - 1] as any
  if (cur.type === 'M') {
    return
  }
  const incCurved = cur.type === 'C'
  const outCurved = out && out.type === 'C'
  if (incCurved || outCurved) {
    if (incCurved) {
      cmds.splice(ci, 1, { type: 'L', x: cur.x, y: cur.y } as Path2DCommand)
    }
    if (outCurved) {
      cmds.splice(ci + 1, 1, { type: 'L', x: out.x, y: out.y } as Path2DCommand)
    }
  }
  else {
    if (!prev || !('x' in prev) || !out || !('x' in out)) {
      return
    }
    const p = { x: prev.x, y: prev.y }
    const c = { x: cur.x, y: cur.y }
    const n = { x: out.x, y: out.y }
    const tl = dist(p, n) || 1
    const tan = { x: (n.x - p.x) / tl, y: (n.y - p.y) / tl }
    const lenIn = dist(p, c) / 3
    const lenOut = dist(c, n) / 3
    cmds.splice(ci, 1, {
      type: 'C',
      x1: p.x + (c.x - p.x) / 3,
      y1: p.y + (c.y - p.y) / 3,
      x2: c.x - tan.x * lenIn,
      y2: c.y - tan.y * lenIn,
      x: c.x,
      y: c.y,
    } as Path2DCommand)
    cmds.splice(ci + 1, 1, {
      type: 'C',
      x1: c.x + tan.x * lenOut,
      y1: c.y + tan.y * lenOut,
      x2: n.x - (n.x - c.x) / 3,
      y2: n.y - (n.y - c.y) / 3,
      x: n.x,
      y: n.y,
    } as Path2DCommand)
  }
  commit()
}

function anchorCount(pi: number): number {
  return paths.value[pi].filter(c => 'x' in (c as any) && 'y' in (c as any)).length
}

function deleteSelected(): void {
  const s = selected.value
  if (!s)
    return
  const cmd = paths.value[s.pi][s.ci] as any
  // Keep at least 2 anchors and don't drop a subpath start.
  if (cmd.type === 'M' || anchorCount(s.pi) <= 2) {
    return
  }
  paths.value[s.pi].splice(s.ci, 1)
  selected.value = null
  commit()
}

function onKeydown(e: KeyboardEvent): void {
  if (e.key === 'Escape') {
    e.preventDefault()
    emit('end')
  }
  else if ((e.key === 'Delete' || e.key === 'Backspace') && selected.value) {
    e.preventDefault()
    deleteSelected()
  }
}

watch(elementSelection, (sel) => {
  if (sel.length !== 1 || !sel[0]?.equal(el)) {
    emit('end')
  }
})

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  onUp()
})
</script>

<template>
  <svg ref="svgTpl" class="m-path-editor" :style="{ overflow: 'visible' }">
    <path
      class="m-path-editor__hit"
      :d="screenPath"
      @dblclick="onInsert"
    />
    <line
      v-for="(c, i) in controls"
      :key="`l${i}`"
      class="m-path-editor__handle-line"
      :x1="c.ax" :y1="c.ay" :x2="c.x" :y2="c.y"
    />
    <circle
      v-for="(c, i) in controls"
      :key="`c${i}`"
      class="m-path-editor__control"
      :cx="c.x" :cy="c.y" r="4"
      @pointerdown="onDown($event, c.pi, c.ci, c.field)"
    />
    <rect
      v-for="(a, i) in anchors"
      :key="`a${i}`"
      class="m-path-editor__anchor"
      :class="{ 'm-path-editor__anchor--selected': a.sel }"
      :x="a.x - 4" :y="a.y - 4" width="8" height="8"
      @pointerdown="onDown($event, a.pi, a.ci, 'xy')"
      @dblclick.stop="toggleSmooth(a.pi, a.ci)"
    />
  </svg>
</template>

<style lang="scss">
  .m-path-editor {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    color: rgba(var(--m-theme-primary), 1);

    &__hit {
      fill: none;
      stroke: transparent;
      stroke-width: 12;
      pointer-events: stroke;
      cursor: copy;
    }

    &__handle-line {
      stroke: currentColor;
      stroke-width: 1;
      stroke-dasharray: 3 2;
      opacity: 0.6;
    }

    &__anchor {
      fill: white;
      stroke: currentColor;
      stroke-width: 1.5;
      pointer-events: auto;
      cursor: move;

      &--selected {
        fill: rgba(var(--m-theme-primary), 1);
      }
    }

    &__control {
      fill: currentColor;
      stroke: white;
      stroke-width: 1;
      pointer-events: auto;
      cursor: move;
    }
  }
</style>

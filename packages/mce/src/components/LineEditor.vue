<script setup lang="ts">
import type { Element2D } from 'modern-canvas'
import { Path2D } from 'modern-path2d'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useEditor } from '../composables/editor'
import { getArrowPath, getLineEndpoints, parseLineShape } from '../utils'

// Figma-style selection for a single straight line / arrow: instead of the
// rectangular bounding box with resize/rotate handles, show only the two
// endpoints (draggable) plus a thin line body that drags the whole thing.
const props = defineProps<{
  element: Element2D
  // Camera mapping (global -> drawboard px), same as Selection passes to Transform.
  scale: [number, number]
  offset: [number, number]
}>()

const editor = useEditor()
const el = props.element
const isArrow = parseLineShape(el)?.kind === 'arrow'

interface Pt { x: number, y: number }

// Frozen element linear transform (rotation + scale, no translation). Used to
// map between global edit space and the element's un-rotated local box so the
// box can hug the line even when the element is rotated/scaled.
let lin = { a: el.transform.a, b: el.transform.b, c: el.transform.c, d: el.transform.d }
let det = lin.a * lin.d - lin.c * lin.b || 1
function parentInv(g: Pt): Pt {
  const pt = el.getParent<Element2D>()?.globalTransform
  return pt ? pt.applyAffineInverse(g) : g
}
// global -> un-rotated, parent-local "u" space
function toU(g: Pt): Pt {
  const p = parentInv(g)
  return { x: (lin.d * p.x - lin.c * p.y) / det, y: (-lin.b * p.x + lin.a * p.y) / det }
}
// u space -> parent-local (apply rotation/scale back)
function applyR(u: Pt): Pt {
  return { x: lin.a * u.x + lin.c * u.y, y: lin.b * u.x + lin.d * u.y }
}

// Logical endpoints in GLOBAL canvas coordinates (a fixed edit space).
const p1 = ref<Pt>({ x: 0, y: 0 })
const p2 = ref<Pt>({ x: 0, y: 0 })

function build(): void {
  // Freeze the linear transform for commit()'s un-rotate math; endpoints come
  // from the shared helper (handles H/V/relative + Vector2→plain).
  lin = { a: el.transform.a, b: el.transform.b, c: el.transform.c, d: el.transform.d }
  det = lin.a * lin.d - lin.c * lin.b || 1
  const eps = getLineEndpoints(el)
  if (!eps) {
    return
  }
  p1.value = eps[0]
  p2.value = eps[1]
}

build()

function toScreen(p: Pt): Pt {
  return { x: p.x * props.scale[0] + props.offset[0], y: p.y * props.scale[1] + props.offset[1] }
}
const s1 = computed(() => toScreen(p1.value))
const s2 = computed(() => toScreen(p2.value))

// Re-derive the element box + path data from the two global endpoints. The path
// always normalises to its own bbox and fills the element box, so we un-rotate
// the endpoints into "u" space, hug the box there, then place the (rotated) box
// back via the center pivot — mirrors PathEditor.commit.
function commit(): void {
  const u1 = toU(p1.value)
  const u2 = toU(p2.value)
  // 先在 u 空间生成路径，用它的真实 bbox 作为元素 box——箭头的翼会超出两端点，
  // 必须把翼算进 box，否则箭头头部会被裁切/压扁。
  const rawData = isArrow
    ? getArrowPath(u1, u2)
    : `M ${u1.x} ${u1.y} L ${u2.x} ${u2.y}`
  const bb = new Path2D(rawData).getBoundingBox()
  const minX = bb.left
  const minY = bb.top
  const w = Math.max(1, bb.width)
  const h = Math.max(1, bb.height)
  const center = applyR({ x: minX + w / 2, y: minY + h / 2 })

  el.style.left = center.x - w / 2
  el.style.top = center.y - h / 2
  el.style.width = w
  el.style.height = h

  // path data 平移到 box 原点（保持与上面同一份几何）。
  const a = { x: u1.x - minX, y: u1.y - minY }
  const b = { x: u2.x - minX, y: u2.y - minY }
  const data = isArrow
    ? getArrowPath(a, b)
    : `M ${a.x} ${a.y} L ${b.x} ${b.y}`
  const paths = el.shape.paths ?? []
  el.shape.paths = [{ ...(paths[0] ?? {}), data }]
}

// Force a fresh undo group so a whole drag collapses into one history step.
function startCapture(): void {
  ;(editor.root.value as any).stopCapturing?.()
}

let drag: { kind: 'p1' | 'p2' | 'body', cx: number, cy: number, a1: Pt, a2: Pt } | undefined

function onDown(e: PointerEvent, kind: 'p1' | 'p2' | 'body'): void {
  e.stopPropagation()
  e.preventDefault()
  startCapture()
  drag = { kind, cx: e.clientX, cy: e.clientY, a1: { ...p1.value }, a2: { ...p2.value } }
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
}

function onMove(e: PointerEvent): void {
  if (!drag) {
    return
  }
  const dx = (e.clientX - drag.cx) / props.scale[0]
  const dy = (e.clientY - drag.cy) / props.scale[1]
  if (drag.kind !== 'p2') {
    p1.value = { x: drag.a1.x + dx, y: drag.a1.y + dy }
  }
  if (drag.kind !== 'p1') {
    p2.value = { x: drag.a2.x + dx, y: drag.a2.y + dy }
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

// Resync when the line changes from outside our own drag — its path (undo/redo)
// or its box (arrow-key nudge, alignment, etc. move style.left/top without
// touching the path, which would otherwise leave the endpoints stale).
watch(
  () => [
    el.shape.paths?.map(p => p.data).join('|') ?? '',
    el.style.left,
    el.style.top,
    el.style.width,
    el.style.height,
  ].join('|'),
  (cur, prev) => {
    if (drag || cur === prev) {
      return
    }
    build()
  },
)

onBeforeUnmount(onUp)
</script>

<template>
  <svg class="m-line-editor" :style="{ overflow: 'visible' }">
    <line
      class="m-line-editor__hit"
      :x1="s1.x" :y1="s1.y" :x2="s2.x" :y2="s2.y"
      @pointerdown="onDown($event, 'body')"
    />
    <line
      class="m-line-editor__line"
      :x1="s1.x" :y1="s1.y" :x2="s2.x" :y2="s2.y"
    />
    <circle
      class="m-line-editor__endpoint"
      :cx="s1.x" :cy="s1.y" r="5"
      @pointerdown="onDown($event, 'p1')"
    />
    <circle
      class="m-line-editor__endpoint"
      :cx="s2.x" :cy="s2.y" r="5"
      @pointerdown="onDown($event, 'p2')"
    />
  </svg>
</template>

<style lang="scss">
  .m-line-editor {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    color: rgba(var(--m-theme-primary), 1);

    &__hit {
      stroke: transparent;
      stroke-width: 12;
      pointer-events: stroke;
      cursor: move;
    }

    &__line {
      stroke: currentColor;
      stroke-width: 1;
      pointer-events: none;
    }

    &__endpoint {
      fill: white;
      stroke: currentColor;
      stroke-width: 1.5;
      pointer-events: auto;
      cursor: crosshair;
    }
  }
</style>

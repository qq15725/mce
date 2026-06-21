<script lang="ts" setup>
import type { Element2D } from 'modern-canvas'
import type { WorkflowPort } from './workflow'
import { Icon, useEditor } from 'mce'
import { computed, ref } from 'vue'
import { getWorkflowPorts, INPUT_PORT, OUTPUT_PORT } from './workflow'

const {
  mode,
  elementSelection,
  getAabb,
  camera,
  drawboardAabb,
  root,
  isElement,
  exec,
  t,
} = useEditor()

const NODE_TYPES = [
  { type: 'text', icon: '$text', kbd: '⇧T' },
  { type: 'image', icon: '$image', kbd: '⇧I' },
  { type: 'video', icon: '$video', kbd: '⇧V' },
]

type PortKind = 'input' | 'output'

// How far (screen px) to push the `+` handle outside the box edge.
const PORT_GAP = 16

// Any element except a connection line is a connectable node in workflow mode.
function isConnectable(el: any): el is Element2D {
  return isElement(el) && !el.connection?.isValid?.()
}

const selectedNode = computed<Element2D | undefined>(() => {
  if (mode.value !== 'workflow')
    return undefined
  const el = elementSelection.value[0]
  // 仅根节点（Doc）下的直接子元素才是工作流节点、才显示连接加号；
  // 画板（Frame）内的元素不参与工作流连接。
  if (!el || !isConnectable(el) || el.getParent?.()?.id !== root.value?.id)
    return undefined
  return el
})

interface ScreenPort { kind: PortKind, idx: number, x: number, y: number }

// The selected node's ports, resolved by type and projected to drawboard space.
const ports = computed<ScreenPort[]>(() => {
  const el = selectedNode.value
  if (!el)
    return []
  const a = getAabb(el, 'drawboard')
  return getWorkflowPorts(el).map((p) => {
    // Push the handle outward along the direction from the box center to the
    // port, so it sits just outside the edge (works for any side/corner).
    let dx = p.x - 0.5
    let dy = p.y - 0.5
    const len = Math.hypot(dx, dy) || 1
    dx /= len
    dy /= len
    return {
      kind: p.kind,
      idx: p.idx,
      x: a.left + a.width * p.x + dx * PORT_GAP,
      y: a.top + a.height * p.y + dy * PORT_GAP,
    }
  })
})

interface DragState {
  port: ScreenPort
  from: { x: number, y: number }
  to: { x: number, y: number }
  sourceId: string
}
const drag = ref<DragState>()

interface MenuState {
  port: ScreenPort
  x: number
  y: number
  position: { x: number, y: number }
  sourceId: string
}
const menu = ref<MenuState>()

function toDrawboard(e: PointerEvent | MouseEvent): { x: number, y: number } {
  return { x: e.clientX - drawboardAabb.value.left, y: e.clientY - drawboardAabb.value.top }
}

function findNodeAt(point: { x: number, y: number }, excludeId: string): Element2D | undefined {
  return (root.value?.children ?? []).find((n: any) => {
    return isConnectable(n) && n.id !== excludeId && getAabb(n, 'drawboard').contains(point)
  }) as Element2D | undefined
}

// A connection always flows output → input. Drag from an output port and the
// other node supplies the input (and vice-versa). Returns false if the other
// node lacks the complementary port (e.g. dropping into a frame, which has no input).
function connect(port: ScreenPort, sourceId: string, otherId: string, otherPorts: WorkflowPort[]): boolean {
  const need: PortKind = port.kind === 'output' ? 'input' : 'output'
  const other = otherPorts.find(p => p.kind === need)
  if (!other)
    return false
  if (port.kind === 'output')
    exec('addWorkflowConnection', sourceId, port.idx, otherId, other.idx)
  else
    exec('addWorkflowConnection', otherId, other.idx, sourceId, port.idx)
  return true
}

function startConnection(port: ScreenPort, e: PointerEvent): void {
  e.stopPropagation()
  e.preventDefault()
  const el = selectedNode.value
  if (!el)
    return
  const sourceId = el.id
  const from = { x: port.x, y: port.y }
  drag.value = { port, from, to: { ...from }, sourceId }

  const onMove = (ev: PointerEvent): void => {
    if (drag.value)
      drag.value = { ...drag.value, to: toDrawboard(ev) }
  }
  const onUp = (ev: PointerEvent): void => {
    document.removeEventListener('pointermove', onMove)
    document.removeEventListener('pointerup', onUp)
    const drop = toDrawboard(ev)
    const target = findNodeAt(drop, sourceId)
    if (target) {
      drag.value = undefined
      connect(port, sourceId, target.id, getWorkflowPorts(target))
    }
    else {
      // 落在空白处：弹出节点类型菜单，保留预览连线直到菜单关闭（选择/取消）
      menu.value = {
        port,
        x: drop.x,
        y: drop.y,
        position: camera.value.toGlobal(drop, { x: 0, y: 0 }),
        sourceId,
      }
    }
  }
  document.addEventListener('pointermove', onMove)
  document.addEventListener('pointerup', onUp)
}

function chooseNodeType(type: string): void {
  const m = menu.value
  menu.value = undefined
  drag.value = undefined
  if (!m)
    return
  const node = exec('addWorkflowNode', type) as Element2D
  // Place the node so its connecting edge sits at the drop point.
  const w = node.style.width as number
  const h = node.style.height as number
  node.style.left = m.port.kind === 'output' ? m.position.x : m.position.x - w
  node.style.top = m.position.y - h / 2
  connect(m.port, m.sourceId, node.id, [INPUT_PORT, OUTPUT_PORT])
}

function closeMenu(): void {
  menu.value = undefined
  drag.value = undefined
}

// Horizontal S-curve between the two drawboard points (matches the canvas
// connection's `curved` routing closely enough for a drag preview).
const previewPath = computed(() => {
  const d = drag.value
  if (!d)
    return ''
  const { from, to } = d
  const dx = Math.max(40, Math.abs(to.x - from.x) * 0.5)
  return `M ${from.x} ${from.y} C ${from.x + dx} ${from.y} ${to.x - dx} ${to.y} ${to.x} ${to.y}`
})

function portStyle(p: ScreenPort): Record<string, string> {
  return { left: `${p.x}px`, top: `${p.y}px` }
}
</script>

<template>
  <div v-if="mode === 'workflow'" class="m-workflow">
    <svg v-if="drag" class="m-workflow__preview">
      <path :d="previewPath" />
    </svg>

    <div
      v-for="port in ports"
      :key="`${port.kind}:${port.idx}`"
      class="m-workflow__port"
      :style="portStyle(port)"
      @pointerdown="startConnection(port, $event)"
    >
      <Icon icon="$plus" />
    </div>

    <template v-if="menu">
      <div class="m-workflow__backdrop" @pointerdown="closeMenu" />
      <div class="m-workflow__menu" :style="{ left: `${menu.x}px`, top: `${menu.y}px` }">
        <div class="m-workflow__menu-title">
          {{ t('creator') }}
        </div>
        <button
          v-for="n in NODE_TYPES"
          :key="n.type"
          type="button"
          class="m-workflow__menu-item"
          @click="chooseNodeType(n.type)"
        >
          <span class="m-workflow__menu-item-main">
            <Icon :icon="n.icon" />
            {{ t(`workflow:${n.type}`) }}
          </span>
          <span class="m-workflow__menu-kbd">{{ n.kbd }}</span>
        </button>
      </div>
    </template>
  </div>
</template>

<style lang="scss">
.m-workflow {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 2;

  &__preview {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    overflow: visible;
    pointer-events: none;

    path {
      fill: none;
      stroke: rgb(var(--m-theme-primary, 30 200 230));
      stroke-width: 2;
      stroke-linecap: round;
    }
  }

  &__port {
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    margin: -9px 0 0 -9px;
    border-radius: 50%;
    background: rgb(var(--m-theme-primary, 30 200 230));
    color: rgb(var(--m-theme-on-primary, 255 255 255));
    font-size: 12px;
    cursor: crosshair;
    pointer-events: auto;
    user-select: none;
    box-shadow: 0 0 0 2px rgb(var(--m-theme-surface, 255 255 255));
  }

  &__backdrop {
    position: fixed;
    inset: 0;
    pointer-events: auto;
  }

  &__menu {
    position: absolute;
    min-width: 200px;
    padding: 6px;
    background: rgb(var(--m-theme-surface, 255 255 255));
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.16);
    pointer-events: auto;
  }

  &__menu-title {
    padding: 6px 10px;
    font-size: 12px;
    color: rgba(var(--m-theme-on-surface, 30 30 30), .5);
  }

  &__menu-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 8px 10px;
    border: 0;
    border-radius: 8px;
    background: transparent;
    font-size: 14px;
    color: rgb(var(--m-theme-on-surface, 30 30 30));
    cursor: pointer;

    &:hover {
      background: rgba(var(--m-theme-on-surface, 30 30 30), .06);
    }
  }

  &__menu-item-main {
    display: flex;
    align-items: center;
    gap: 8px;

    .m-icon {
      font-size: 18px;
      color: rgba(var(--m-theme-on-surface, 30 30 30), .6);
    }
  }

  &__menu-kbd {
    font-size: 12px;
    color: rgba(var(--m-theme-on-surface, 30 30 30), .5);
  }
}
</style>

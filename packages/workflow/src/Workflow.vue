<script lang="ts" setup>
import type { Element2D } from 'modern-canvas'
import type { WorkflowPort } from './workflow'
import { Icon, useEditor } from 'mce'
import { computed, ref } from 'vue'
import NodeLabel from './NodeLabel.vue'
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

// 端口「+」磁吸：每个端口是一个大的透明命中圆，可见的「+」居中于其内。
// 仅当鼠标进入该圆时（元素自身 pointermove）才把「+」朝指针移动、离开(pointerleave)回中心——
// 只走端口自身 DOM 事件 + 直接改 transform，不监听 document/画布、不写响应式，性能开销极小。
const MAX_PULL = 40
function onPortMove(e: PointerEvent): void {
  const host = e.currentTarget as HTMLElement
  const dot = host.firstElementChild as HTMLElement | null
  if (!dot) {
    return
  }
  const r = host.getBoundingClientRect()
  const dx = e.clientX - (r.left + r.width / 2)
  const dy = e.clientY - (r.top + r.height / 2)
  const dist = Math.hypot(dx, dy) || 1
  const pull = Math.min(dist, MAX_PULL)
  dot.style.transform = `translate(${(dx / dist) * pull}px, ${(dy / dist) * pull}px)`
}
function onPortLeave(e: PointerEvent): void {
  const dot = (e.currentTarget as HTMLElement).firstElementChild as HTMLElement | null
  if (dot) {
    dot.style.transform = ''
  }
}

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

// 工作流模式下的顶层元素（画板 / 节点，排除连线）——给每个加图层图标+名称标签。
const topLabels = computed<Element2D[]>(() =>
  mode.value === 'workflow'
    ? (root.value?.children ?? []).filter(
        (el): el is Element2D => isElement(el) && !(el as any).connection?.isValid?.(),
      )
    : [],
)

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

// 端口用 transform 定位（避免 left/top 重排）；magnetic 位移在内部「+」dot 上，互不影响。
function portStyle(p: ScreenPort): Record<string, string> {
  return { transform: `translate(${p.x}px, ${p.y}px)` }
}
</script>

<template>
  <div v-if="mode === 'workflow'" class="m-workflow">
    <NodeLabel v-for="el in topLabels" :key="el.id" :node="el" />

    <svg v-if="drag" class="m-workflow__preview">
      <path :d="previewPath" />
    </svg>

    <div
      v-for="port in ports"
      :key="`${port.kind}:${port.idx}`"
      class="m-workflow__port"
      :style="portStyle(port)"
      @pointerdown="startConnection(port, $event)"
      @pointermove="onPortMove"
      @pointerleave="onPortLeave"
    >
      <span class="m-workflow__port-dot">
        <Icon icon="$plus" />
      </span>
    </div>

    <!-- 创建节点菜单：teleport 到 body 并用客户端坐标 + 高 z-index，
         escape 工作流覆盖层的 z-index 上下文，盖过顶部/底部浮动条。 -->
    <Teleport to="body">
      <template v-if="menu">
        <div class="m-workflow__backdrop" @pointerdown="closeMenu" />
        <div
          class="m-workflow__menu"
          :style="{ left: `${menu.x + drawboardAabb.left}px`, top: `${menu.y + drawboardAabb.top}px` }"
        >
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
    </Teleport>
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

  // 大的透明命中圆：鼠标进入其范围即触发磁吸，把内部「+」移向指针。
  &__port {
    position: absolute;
    left: 0;
    top: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 96px;
    height: 96px;
    margin: -48px 0 0 -48px;
    border-radius: 50%;
    background: transparent;
    cursor: crosshair;
    pointer-events: auto;
    user-select: none;
  }

  // 可见的「+」圆点，居中于命中圆，磁吸时以 transform 平滑移向指针。
  &__port-dot {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: rgb(var(--m-theme-primary, 30 200 230));
    color: rgb(var(--m-theme-on-primary, 255 255 255));
    font-size: 12px;
    box-shadow: 0 0 0 2px rgb(var(--m-theme-surface, 255 255 255));
    transition: transform .1s ease-out;
  }

  &__backdrop {
    position: fixed;
    inset: 0;
    // 高于顶部/底部浮动条（Overlay z-index 1500+），让创建节点菜单浮在最上层。
    z-index: 2000;
    pointer-events: auto;
  }

  &__menu {
    position: fixed;
    z-index: 2001;
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

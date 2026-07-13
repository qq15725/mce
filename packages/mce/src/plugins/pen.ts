import type { Element2D } from 'modern-canvas'
import type { Ref } from 'vue'
import { Path2D, Vector2 } from 'modern-path2d'
import { h, ref, watch } from 'vue'
import PenDraftOverlay from '../components/PenDraftOverlay.vue'
import { definePlugin } from '../plugin'
import { placeElementByBox } from '../utils'

declare global {
  namespace Mce {
    interface Tools {
      pen: []
      pencil: []
    }
  }
}

/**
 * 钢笔绘制态的一个锚点（世界坐标）。角点：curved=false 且两侧控制柄退化到锚点自身
 * （ix/iy = ox/oy = x/y）。曲线点：curved=true，ix/iy 为入向柄、ox/oy 为出向柄，默认镜像。
 */
export interface PenAnchor {
  x: number
  y: number
  curved: boolean
  ix: number
  iy: number
  ox: number
  oy: number
}

export interface PenDraft {
  anchors: PenAnchor[]
  cursor: { x: number, y: number } | null
  /** 光标是否悬停在可闭合的起点上（显示高亮圆圈）。 */
  closeHover: boolean
  closed: boolean
}

export default definePlugin((editor) => {
  const {
    addElement,
    renderEngine,
    activeTool,
    activateTool,
    getGlobalPointer,
    camera,
    selection,
    state,
    getConfigRef,
    root,
  } = editor

  // 画笔与直线/箭头共用「绘制样式」（描边色 + 线宽），由工具选项面板编辑。
  const drawStyle = getConfigRef<Mce.DrawStyleConfig>('interaction.drawStyle')

  // 绘制态可视数据，喂给 PenDraftOverlay（锚点方块 / 控制柄 / 起点闭合圈 / 橡皮筋预览）。
  const draft: Ref<PenDraft | undefined> = ref()

  let el: Element2D | undefined
  const anchors: PenAnchor[] = []
  // 当前 pointerdown 落下、正在被 move 拖出控制柄的锚点及其按下位置（世界坐标）。
  let dragging: { anchor: PenAnchor, startX: number, startY: number, dragged: boolean } | undefined
  let onMove: (() => void) | undefined
  let onKey: ((e: KeyboardEvent) => void) | undefined
  let onKeyUp: ((e: KeyboardEvent) => void) | undefined
  let stopWatch: (() => void) | undefined
  // 修饰键状态：move() 只拿到世界坐标点、拿不到事件，靠全局跟踪。
  let shiftKey = false
  let altKey = false

  const closeThreshold = () => 8 / (camera.value.zoom.x || 1)

  function newAnchor(x: number, y: number): PenAnchor {
    return { x, y, curved: false, ix: x, iy: y, ox: x, oy: y }
  }

  // 一段的 SVG 命令：两端都是角点 → 直线 L；任一端带柄 → 三次贝塞尔 C（角点侧的柄即锚点自身）。
  function segTo(a: PenAnchor, b: PenAnchor): string {
    if (!a.curved && !b.curved) {
      return `L ${b.x} ${b.y}`
    }
    return `C ${a.ox} ${a.oy} ${b.ix} ${b.iy} ${b.x} ${b.y}`
  }

  // 已落锚点生成 path data（世界坐标；不含 cursor 橡皮筋预览——那只画在 overlay）。
  function buildData(closed: boolean): string {
    if (!anchors.length) {
      return ''
    }
    let d = `M ${anchors[0].x} ${anchors[0].y}`
    for (let i = 1; i < anchors.length; i++) {
      d += ` ${segTo(anchors[i - 1], anchors[i])}`
    }
    if (closed && anchors.length > 1) {
      d += ` ${segTo(anchors[anchors.length - 1], anchors[0])} Z`
    }
    return d
  }

  function update(closed = false) {
    if (!el) {
      return
    }
    const data = buildData(closed)
    el.shape.paths = [{ data }]
    // 锚点按世界坐标维护；元素若已嵌入画板(frame)，placeElementByBox 会减去父原点。
    placeElementByBox(el, new Path2D(data).getBoundingBox(), root.value)
  }

  function syncDraft(closed = false) {
    draft.value = {
      anchors: anchors.map(a => ({ ...a })),
      cursor: getGlobalPointer() ?? null,
      closeHover: false,
      closed,
    }
  }

  // End the in-progress path: optionally close it, commit, then tear down. The
  // pen stays alive across clicks until this runs (tool switch / Esc / Enter /
  // clicking the start).
  function finish(close = false) {
    if (!el) {
      return
    }
    const ref = el
    const placed = anchors.length
    if (placed > 1) {
      update(close)
    }
    renderEngine.value.off('pointermove', onMove as any)
    if (onKey) {
      window.removeEventListener('keydown', onKey)
    }
    if (onKeyUp) {
      window.removeEventListener('keyup', onKeyUp)
    }
    stopWatch?.()
    stopWatch = undefined
    onMove = undefined
    onKey = undefined
    onKeyUp = undefined
    dragging = undefined
    shiftKey = false
    altKey = false
    el = undefined
    anchors.length = 0
    draft.value = undefined
    if (placed > 1) {
      selection.value = [ref]
    }
    else {
      ref.remove()
    }
  }

  // 本次 pointerdown 期间的拖拽：把刚落的锚点拖出镜像控制柄（Shift 约束 45°、Alt 断镜像成
  // 独立柄 = 尖角进 / 曲线出）。位移小于阈值则保持角点。松开固定该锚点。
  function dragHandlers() {
    return {
      move: (p: { x: number, y: number }) => {
        if (!dragging) {
          return
        }
        let dx = p.x - dragging.startX
        let dy = p.y - dragging.startY
        const dist = Math.hypot(dx, dy)
        if (!dragging.dragged && dist < 4 / (camera.value.zoom.x || 1)) {
          return
        }
        dragging.dragged = true
        if (shiftKey && dist > 0) {
          const ang = Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) * (Math.PI / 4)
          dx = Math.cos(ang) * dist
          dy = Math.sin(ang) * dist
        }
        const a = dragging.anchor
        a.curved = true
        a.ox = a.x + dx
        a.oy = a.y + dy
        if (altKey) {
          a.ix = a.x
          a.iy = a.y
        }
        else {
          a.ix = a.x - dx
          a.iy = a.y - dy
        }
        update()
        syncDraft()
      },
      end: () => {
        dragging = undefined
        syncDraft()
      },
    }
  }

  return {
    name: 'mce:pen',
    components: [
      {
        type: 'overlay',
        component: () => h(PenDraftOverlay, { draft: draft.value }),
      },
    ],
    tools: [
      {
        name: 'pen',
        handle: (start) => {
          // 已在绘制中：先判是否点回起点闭合，否则落一个新锚点。
          if (el) {
            const first = anchors[0]
            if (first && anchors.length > 1 && new Vector2(first.x, first.y).distanceTo(start) < closeThreshold()) {
              finish(true)
              activateTool(undefined)
              return
            }
            const anchor = newAnchor(start.x, start.y)
            anchors.push(anchor)
            dragging = { anchor, startX: start.x, startY: start.y, dragged: false }
            update()
            syncDraft()
            return dragHandlers()
          }

          // 首次落点：建元素 + 起始锚点，接管全程 pointermove（橡皮筋预览）与键盘。
          el = addElement({
            name: 'pen',
            style: { width: 1, height: 1 },
            outline: {
              color: drawStyle.value.color,
              width: drawStyle.value.width,
              lineCap: 'round',
              lineJoin: 'round',
            },
            meta: { inPptIs: 'Shape' },
          }, {
            position: start,
          })
          const anchor = newAnchor(start.x, start.y)
          anchors.push(anchor)
          dragging = { anchor, startX: start.x, startY: start.y, dragged: false }
          update()

          // 全程橡皮筋预览：未按下拖柄时，随光标刷新 overlay（含靠近起点的闭合高亮）。
          onMove = () => {
            const p = getGlobalPointer()
            if (!p) {
              return
            }
            const first = anchors[0]
            const closeHover = !!first && anchors.length > 1 && !dragging
              && new Vector2(first.x, first.y).distanceTo(p) < closeThreshold()
            draft.value = {
              anchors: anchors.map(a => ({ ...a })),
              cursor: p,
              closeHover,
              closed: false,
            }
          }
          renderEngine.value.on('pointermove', onMove)

          onKey = (e: KeyboardEvent) => {
            shiftKey = e.shiftKey
            altKey = e.altKey
            if (e.key === 'Enter' || e.key === 'Escape') {
              e.preventDefault()
              finish(false)
              activateTool(undefined)
            }
          }
          onKeyUp = (e: KeyboardEvent) => {
            shiftKey = e.shiftKey
            altKey = e.altKey
          }
          window.addEventListener('keydown', onKey)
          window.addEventListener('keyup', onKeyUp)

          syncDraft()

          // Finish (without changing tool) when the tool/state changes externally.
          stopWatch = watch([state, activeTool], () => finish(false))

          return dragHandlers()
        },
      },
      {
        name: 'pencil',
        handle: (start) => {
          const el = addElement({
            name: 'pencil',
            style: {
              width: 1,
              height: 1,
            },
            outline: {
              color: drawStyle.value.color,
              width: drawStyle.value.width,
              lineCap: 'round',
              lineJoin: 'round',
            },
            meta: {
              inPptIs: 'Shape',
            },
          }, {
            position: start,
          })

          const path = new Path2D()
          path.moveTo(start.x, start.y)

          const update = () => {
            el.shape.paths = [
              { data: path.toData() },
            ]
            placeElementByBox(el, path.getBoundingBox(), root.value)
          }

          update()

          return {
            move: (move) => {
              path.lineTo(move.x, move.y)
              path.moveTo(move.x, move.y)
              update()
            },
          }
        },
      },
    ],
    hotkeys: [
      { command: 'activateTool:pen', key: 'P' },
      { command: 'activateTool:pencil', key: 'Shift+P' },
    ],
  }
})

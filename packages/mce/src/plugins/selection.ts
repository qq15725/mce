import type { Aabb2D, Element2D, Node } from 'modern-canvas'
import { Obb2D } from 'modern-canvas'
import ScrollToSelection from '../components/ScrollToSelection.vue'
import Selection from '../components/Selection.vue'
import { definePlugin } from '../plugin'
import { isFlexContainer } from '../utils/helper'
import { getLineEndpoints, parseLineShape } from '../utils/line'

declare global {
  namespace Mce {
    type SelectTarget
      = | 'none'
        | 'all'
        | 'inverse'
        | 'children'
        | 'parent'
        | 'previousSibling'
        | 'nextSibling'
        | Node[]

    interface Commands {
      startTransform: (event?: MouseEvent) => boolean
      select: (target: SelectTarget) => void
      marqueeSelect: (marquee?: Aabb2D) => void
      selectAll: () => void
      selectInverse: () => void
      selectNone: () => void
      selectChildren: () => void
      selectParent: () => void
      selectPreviousSibling: () => void
      selectNextSibling: () => void
      groupSelection: () => void
      ungroupSelection: () => void
      frameSelection: () => void
      toggleSelectionVisible: (target?: 'show' | 'hide') => void
      toggleSelectionLock: (target?: 'lock' | 'unlock') => void
    }

    interface Hotkeys {
      selectAll: [event: KeyboardEvent]
      selectInverse: [event: KeyboardEvent]
      selectNone: [event: KeyboardEvent]
      selectChildren: [event: KeyboardEvent]
      selectParent: [event: KeyboardEvent]
      selectPreviousSibling: [event: KeyboardEvent]
      selectNextSibling: [event: KeyboardEvent]
      groupSelection: [event: KeyboardEvent]
      ungroupSelection: [event: KeyboardEvent]
      frameSelection: [event: KeyboardEvent]
      toggleSelectionVisible: [event: KeyboardEvent]
      toggleSelectionLock: [event: KeyboardEvent]
    }

    interface Slots {
      'selection'?: () => void
      'selection.transform'?: () => void
      'selection.foreground-cropper'?: (props: { scale: number, setScale: (scale: number) => void, setAspectRatio: (aspectRatio: 0 | [number, number]) => void, ok: () => void, cancel: () => void }) => void
    }

    interface Events {
      selectionTransformStarted: [context: TransformContext]
      selectionTransformed: [context: TransformContext]
      selectionTransformEnded: [context: TransformContext]
    }
  }
}

interface Rect { left: number, top: number, right: number, bottom: number }
interface Point { x: number, y: number }

function pointInRect(p: Point, r: Rect): boolean {
  return p.x >= r.left && p.x <= r.right && p.y >= r.top && p.y <= r.bottom
}

// 线段相交（基于方向叉积），含共线相接的端点重合情形。
function segmentsIntersect(a: Point, b: Point, c: Point, d: Point): boolean {
  const cross = (o: Point, p: Point, q: Point): number =>
    (p.x - o.x) * (q.y - o.y) - (p.y - o.y) * (q.x - o.x)
  const d1 = cross(c, d, a)
  const d2 = cross(c, d, b)
  const d3 = cross(a, b, c)
  const d4 = cross(a, b, d)
  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0))
    && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
    return true
  }
  const onSeg = (o: Point, q: Point, p: Point): boolean =>
    Math.min(o.x, q.x) <= p.x && p.x <= Math.max(o.x, q.x)
    && Math.min(o.y, q.y) <= p.y && p.y <= Math.max(o.y, q.y)
  if (d1 === 0 && onSeg(c, d, a))
    return true
  if (d2 === 0 && onSeg(c, d, b))
    return true
  if (d3 === 0 && onSeg(a, b, c))
    return true
  if (d4 === 0 && onSeg(a, b, d))
    return true
  return false
}

// 折线（drawboard 坐标）与框选矩形是否相交：任一顶点落在矩形内，或任一线段穿过矩形某条边。
function polylineIntersectsRect(poly: Point[], r: Rect): boolean {
  const corners: Point[] = [
    { x: r.left, y: r.top },
    { x: r.right, y: r.top },
    { x: r.right, y: r.bottom },
    { x: r.left, y: r.bottom },
  ]
  for (let i = 0; i < poly.length - 1; i++) {
    const a = poly[i]
    const b = poly[i + 1]
    if (pointInRect(a, r) || pointInRect(b, r)) {
      return true
    }
    for (let j = 0; j < 4; j++) {
      if (segmentsIntersect(a, b, corners[j], corners[(j + 1) % 4])) {
        return true
      }
    }
  }
  return false
}

export default definePlugin((editor) => {
  const {
    isElement,
    selection,
    selectionMarquee,
    elementSelection,
    getObb,
    getAabb,
    root,
    findSibling,
    inEditorIs,
    isFrameNode,
    addElement,
    addElements,
    obbToFit,
    setVisible,
    isVisible,
    setLock,
    isLock,
    exec,
    globalToDrawboard,
  } = editor

  function select(target: Mce.SelectTarget) {
    switch (target) {
      case 'none':
        selection.value = []
        break
      case 'all':
        selection.value = [...root.value.children]
        break
      case 'inverse': {
        const current = selection.value
        selection.value = root.value.children.filter(
          node => !current.some(v => v.equal(node)),
        )
        break
      }
      case 'children': {
        const children = selection.value[0]?.children
        if (children?.length) {
          selection.value = [...children]
        }
        break
      }
      case 'parent': {
        const parent = selection.value[0]?.parent
        if (isElement(parent)) {
          selection.value = [parent]
        }
        break
      }
      case 'previousSibling':
      case 'nextSibling': {
        const sibling = findSibling(target === 'previousSibling' ? 'previous' : 'next')
        if (sibling) {
          selection.value = [sibling]
          exec('zoomTo', 'selection', {
            intoView: true,
            behavior: 'smooth',
          })
        }
        break
      }
      default:
        selection.value = target
        break
    }
  }

  // 线/箭头/连线的命中折线（drawboard 坐标）：直线/箭头取两端点，连线取路由控制点。
  // 非线类返回 null，回退到包围盒判定。线类的包围盒是覆盖两端点的大矩形，对斜线而言
  // 一大片空白也落在盒内，直接用盒判定会把没碰到线身的框选误判为命中（见斜线示例）。
  function linePolylineInDrawboard(node: Element2D): { x: number, y: number }[] | null {
    let worldPts: { x: number, y: number }[] | null = null
    if (parseLineShape(node)) {
      worldPts = getLineEndpoints(node)
    }
    else {
      const conn = (node as any).connection
      if (conn?.isValid?.()) {
        const refs = conn.route?.()?.getControlPointRefs?.()
        if (refs?.length) {
          worldPts = refs.map((p: any) => ({ x: p.x, y: p.y }))
        }
      }
    }
    if (!worldPts || worldPts.length < 2) {
      return null
    }
    return worldPts.map(p => globalToDrawboard(p))
  }

  function marqueeSelect(marquee = selectionMarquee.value): void {
    // 把矩形选区包装为 OBB 便于 contains 测试；后续若支持旋转 marquee 也可在此处替换。
    const area = new Obb2D(marquee)
    const rect = {
      left: marquee.left,
      top: marquee.top,
      right: marquee.left + marquee.width,
      bottom: marquee.top + marquee.height,
    }
    // 每个节点的 obb 在本次框选中最多算一次（flatMap 与 filter 复用），
    // 避免对 frame 等节点重复调 getObb。
    const obbCache = new Map<Element2D, Obb2D>()
    const obbOf = (node: Element2D): Obb2D => {
      let obb = obbCache.get(node)
      if (!obb) {
        obb = getObb(node, 'drawboard')
        obbCache.set(node, obb)
      }
      return obb
    }
    // 线类按线身（线段/折线 vs 框选矩形）判定，其余元素按包围盒相交判定。
    const hit = (node: Element2D): boolean => {
      const poly = linePolylineInDrawboard(node)
      if (poly) {
        return polylineIntersectsRect(poly, rect)
      }
      return obbOf(node).overlap(area)
    }
    selection.value = root.value
      ?.children
      .flatMap((node) => {
        if (
          isFrameNode(node, true)
          && !area.contains(obbOf(node as Element2D))
        ) {
          return node.children as unknown as Element2D[]
        }
        return [node] as Element2D[]
      })
      .filter((node) => {
        return 'isVisibleInTree' in node
          && node.isVisibleInTree()
          && hit(node)
          && !isLock(node)
          // 框选排除连线：连线随端点自动路由，纳入多选会让整体拖拽出问题。
          && !(node as any).connection?.isValid?.()
          && !node.findAncestor(ancestor => isLock(ancestor))
      }) ?? []
  }

  function groupSelection(inEditorIs: 'Element' | 'Frame'): void {
    const elements = elementSelection.value
    if (!elements.length) {
      return
    }
    const element = elements[0]
    const parent = element.parent
    const aabb = getAabb(elements, 'parent')
    const children = elements.map((child) => {
      const cloned = child.toJSON()
      cloned.style.left = child.style.left - aabb.left
      cloned.style.top = child.style.top - aabb.top
      return cloned
    })
    root.value.transact(() => {
      addElement({
        name: inEditorIs === 'Frame' ? 'Frame' : 'Group',
        style: {
          left: aabb.left,
          top: aabb.top,
          width: aabb.width,
          height: aabb.height,
        },
        children,
        meta: {
          inPptIs: 'GroupShape',
          inEditorIs,
        },
      }, {
        parent,
        index: parent ? element.getIndex() : undefined,
        active: true,
        regenId: true,
      })
      elements.forEach(node => node.remove())
    })
  }

  function ungroupSelection() {
    const element = elementSelection.value[0]
    if (!element || !element.children.length)
      return
    const parent = getObb(element, 'parent')
    const items = element.children.map((child) => {
      const obb = getObb(child, 'parent')
      const cloned = child.toJSON()
      cloned.style.left = obb.left + parent.left
      cloned.style.top = obb.top + parent.top
      return cloned
    })
    root.value.transact(() => {
      addElements(items, {
        parent: element.parent,
        index: element.getIndex(),
        active: true,
        regenId: true,
      })
      element.remove()
    })
  }

  function toggleSelectionVisible(target?: 'show' | 'hide'): void {
    elementSelection.value.forEach((el) => {
      switch (target) {
        case 'show':
          setVisible(el, true)
          break
        case 'hide':
          setVisible(el, false)
          break
        default:
          setVisible(el, !isVisible(el))
          break
      }
    })
  }

  function toggleSelectionLock(target?: 'lock' | 'unlock'): void {
    selection.value.forEach((el) => {
      switch (target) {
        case 'lock':
          setLock(el, true)
          break
        case 'unlock':
          setLock(el, false)
          break
        default:
          setLock(el, !isLock(el))
          break
      }
    })
  }

  return {
    name: 'mce:selection',
    commands: [
      { command: 'select', handle: select },
      { command: 'marqueeSelect', handle: marqueeSelect },
      { command: 'selectAll', handle: () => select('all') },
      { command: 'selectInverse', handle: () => select('inverse') },
      { command: 'selectNone', handle: () => select('none') },
      { command: 'selectChildren', handle: () => select('children') },
      { command: 'selectParent', handle: () => select('parent') },
      { command: 'selectPreviousSibling', handle: () => select('previousSibling') },
      { command: 'selectNextSibling', handle: () => select('nextSibling') },
      { command: 'groupSelection', handle: () => groupSelection('Element') },
      { command: 'ungroupSelection', handle: ungroupSelection },
      { command: 'frameSelection', handle: () => groupSelection('Frame') },
      { command: 'toggleSelectionVisible', handle: toggleSelectionVisible },
      { command: 'toggleSelectionLock', handle: toggleSelectionLock },
    ],
    hotkeys: [
      { command: 'selectAll', key: 'CmdOrCtrl+A' },
      { command: 'selectInverse', key: 'Shift+CmdOrCtrl+A' },
      { command: 'selectNone', key: 'Esc' },
      { command: 'selectChildren', key: 'Enter' },
      { command: 'selectParent', key: '\\' },
      { command: 'selectPreviousSibling', key: 'Shift+Tab' },
      { command: 'selectNextSibling', key: 'Tab' },
      { command: 'groupSelection', key: 'CmdOrCtrl+G' },
      { command: 'ungroupSelection', key: 'CmdOrCtrl+Backspace' },
      { command: 'frameSelection', key: 'Alt+CmdOrCtrl+G' },
      { command: 'toggleSelectionVisible', key: 'Shift+CmdOrCtrl+H' },
      { command: 'toggleSelectionLock', key: 'Shift+CmdOrCtrl+L' },
    ],
    events: {
      // 切文档清选区由 0.context.ts 的 onSetDoc 统一处理（docSet）；这里仅保留显式清空语义。
      docCleared: () => select('none'),
      selectionTransformed: () => {
        elementSelection.value.forEach((el) => {
          el.findAncestor((ancestor) => {
            if (
              isElement(ancestor)
              && !inEditorIs(ancestor, 'Frame')
              // Flex/auto-layout containers are sized by the layout engine;
              // obbToFit would force a relayout through the reactive node and
              // throw a yoga embind Proxy error.
              && !isFlexContainer(ancestor)
            ) {
              obbToFit(ancestor)
            }
            return false
          })
        })
      },
    },
    components: [
      { slot: 'selection', type: 'overlay', component: Selection },
      { type: 'overlay', component: ScrollToSelection },
    ],
  }
})

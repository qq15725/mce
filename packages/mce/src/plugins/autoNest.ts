import type { Element2D, Node } from 'modern-canvas'
import type { Vector2Like } from 'modern-path2d'
import { Node2D } from 'modern-canvas'
import { definePlugin } from '../plugin'
import { isFlexContainer } from '../utils/helper'

declare global {
  namespace Mce {
    interface NestIntoFrameOptions {
      pointer: Vector2Like
      parent: Element2D
      index: number
      excluded: Set<number>
      /**
       * During a live drag: flex frames are owned by flexLayout, so skip them
       * here (avoids double moveChild). Omitted for one-shot drops (new nodes /
       * paste), where we DO insert into flex at the main-axis index.
       */
      fromDrag?: boolean
    }

    interface Commands {
      nestIntoFrame: (
        element: Element2D,
        options?: NestIntoFrameOptions,
      ) => void
    }
  }
}

export default definePlugin((editor) => {
  const {
    getGlobalPointer,
    frames,
    isFrameNode,
    isElement,
    exec,
    root,
    elementSelection,
  } = editor

  let context: Record<string, any> | undefined

  // modern-canvas markRaw's the yoga node, so a reactive node's moveChild both
  // avoids the embind Proxy crash AND keeps the Vue tree (what the layers panel
  // renders) in sync. Do NOT toRaw here — that mutates the raw node, bypassing
  // reactivity, so the canvas updates but the layers panel doesn't (they desync).
  function safeMoveChild(parent: Node, el: Element2D, index: number): void {
    parent.moveChild(el, index)
  }

  // 普通画板换父级时保留完整世界变换。AABB 左上角不是旋转元素的局部原点，
  // 直接相减会同时改变位置与角度；滚动偏移也必须计入新的父级坐标系。
  function movePreservingTransform(parent: Node, el: Element2D, index: number): void {
    const local = el.globalTransform.clone()
    // Doc 根节点没有二维变换，移回根节点时直接使用世界坐标。
    if (parent instanceof Node2D) {
      const matrix = parent.globalTransform
      if (matrix.a * matrix.d - matrix.b * matrix.c === 0)
        return
      local.prepend(matrix.clone().affineInverse())
        .translate(parent.contentOffset.x, parent.contentOffset.y)
    }
    const { a, b, c, d, tx, ty } = local
    const scaleX = Math.hypot(a, b)
    const scaleY = (a * d - b * c) / scaleX
    if (!scaleX || !scaleY)
      return
    const { x: px, y: py } = el.pivot
    safeMoveChild(parent, el, index)
    // Node2D 用 tan(skew)，与 Transform2D.decompose 的斜切约定不同。
    Object.assign(el.style, {
      left: tx + px * a + py * c - px,
      top: ty + px * b + py * d - py,
      rotate: Math.atan2(b, a) * 180 / Math.PI,
      scaleX,
      scaleY,
      skewX: Math.atan((a * c + b * d) / (scaleX * scaleY)),
      skewY: 0,
      transform: '',
    })
    el.updateGlobalTransform()
  }

  // Main-axis insert index in a flex frame for a world-space pointer (one-shot;
  // reads live child AABBs — no need for flexLayout's anti-jitter analytic path).
  function flexInsertIndex(frame: Element2D, el: Element2D, pointer: Vector2Like): number {
    const dir = (frame.style as any).flexDirection ?? 'row'
    const horizontal = dir === 'row' || dir === 'row-reverse'
    const reverse = typeof dir === 'string' && dir.endsWith('-reverse')
    const children = frame.children.filter(c => isElement(c) && !c.equal(el)) as Element2D[]
    const mid = horizontal ? pointer.x : pointer.y
    let before = 0
    for (const c of children) {
      const a = c.globalAabb
      const center = horizontal ? a.x + a.width / 2 : a.y + a.height / 2
      if (center < mid)
        before++
    }
    return reverse ? children.length - before : before
  }

  // Innermost flex container (any element, not just top-level frames) whose world
  // AABB contains the pointer — for one-shot drops into auto-layout (a drop over a
  // nested auto-layout lands in the nested one, matching the live-drag behaviour).
  function flexContainerAt(el: Element2D, pointer: Vector2Like): Element2D | undefined {
    let hit: Element2D | undefined
    const visit = (node: Element2D): void => {
      for (const child of node.children) {
        if (!isElement(child))
          continue
        const c = child as Element2D
        if (c.equal(el) || c.findAncestor(n => n.equal(el)))
          continue
        if (isFlexContainer(c)) {
          const aabb = c.globalAabb
          if (aabb.contains(pointer) && (!hit || aabb.getArea() < hit.globalAabb.getArea()))
            hit = c
        }
        visit(c)
      }
    }
    visit(root.value as any)
    return hit
  }

  function nestIntoFrame(
    el: Element2D,
    options?: Mce.NestIntoFrameOptions,
  ): void {
    // workflow 节点（meta.inEditorIs 形如 'WorkflowText'）始终独立于画板，不被自动嵌入
    if (el.meta?.inEditorIs?.startsWith('Workflow')) {
      return
    }
    const pointer = options?.pointer as any

    // One-shot drop (new node / paste — not a live drag) landing inside an
    // auto-layout container (any flex element, incl. non-frame): insert at the
    // main-axis index. Live drags into flex are owned by flexLayout (skip then).
    if (!options?.fromDrag && pointer) {
      const flex = flexContainerAt(el, pointer)
      if (flex && !flex.equal(el.getParent<Element2D>())) {
        safeMoveChild(flex, el, flexInsertIndex(flex, el, pointer))
        el.updateGlobalTransform()
        exec('layerScrollIntoView')
        return
      }
    }

    const frame1 = el.findAncestor(node => isFrameNode(node, true))
    const aabb1 = el.globalAabb
    const area1 = aabb1.getArea()
    let flag = true
    for (let i = 0, len = frames.value.length; i < len; i++) {
      const frame2 = frames.value[i]
      if (options?.excluded?.has(frame2.instanceId) || frame2.equal(el)) {
        continue
      }
      const aabb2 = frame2.globalAabb
      if (
        pointer
          ? aabb2.contains(pointer)
          : (aabb1 && aabb1.getIntersectionRect(aabb2).getArea() > area1 * 0.5)
      ) {
        // flex 画板：拖拽期归 flexLayout（进/出/内排 + 插入指示线都在那）；一次性落定
        // （新建 / 粘贴 / 外部 drop）时在此按主轴插入到正确位置。
        if (isFlexContainer(frame2)) {
          if (!options?.fromDrag && !frame2.equal(frame1)) {
            const idx = flexInsertIndex(frame2, el, pointer ?? getGlobalPointer())
            safeMoveChild(frame2, el, idx)
            el.updateGlobalTransform()
            exec('layerScrollIntoView')
          }
          flag = false
          break
        }
        if (!frame2.equal(frame1)) {
          let index = frame2.children.length
          if (frame2.equal(options?.parent)) {
            index = options!.index
          }
          movePreservingTransform(frame2, el, index)
          exec('layerScrollIntoView')
        }
        flag = false
        break
      }
    }

    if (
      flag
      && frame1
    ) {
      let index = root.value.children.length
      if (root.value.equal(options?.parent)) {
        index = options!.index
      }
      movePreservingTransform(root.value, el, index)
      exec('layerScrollIntoView')
    }
  }

  return {
    name: 'mce:autoNest',
    commands: [
      { command: 'nestIntoFrame', handle: nestIntoFrame },
    ],
    events: {
      selectionTransformStarted: ({ handle, event }) => {
        if (handle !== 'move' || (event as any)?.__FROM__) {
          return
        }

        const pointer = getGlobalPointer()
        const startFrame = frames.value.find(frame => frame.globalAabb.contains(pointer))

        const idSet = new Set<number>()
        elementSelection.value.forEach((el) => {
          const frame = isFrameNode(el, true) ? el : el.findAncestor(v => isFrameNode(v, true))
          if (frame) {
            if (frame.equal(startFrame)) {
              idSet.add(frame.instanceId)
            }
          }
          else {
            idSet.add(0)
          }
        })
        if (idSet.size === 1) {
          const ctx: Record<string, any> = {}
          elementSelection.value.forEach((el) => {
            ctx[el.instanceId] = {
              parent: el.getParent(),
              index: el.getIndex(),
            }
          })
          context = ctx
        }
      },
      selectionTransformed: () => {
        if (context) {
          const excluded = new Set(elementSelection.value.map(el => el.instanceId))
          elementSelection.value.forEach((el) => {
            // A flex child is owned by flexLayout (reorder / enter / leave). If
            // autoNest detached it here (its generic frame-leave), flexLayout's
            // `drag` would go stale and reset the element to (0,0) on drop. Once
            // flexLayout moves it out to root (parent no longer flex), autoNest
            // resumes and can nest it into a plain frame underneath.
            const parent = el.getParent<Element2D>()
            if (parent && isFlexContainer(parent)) {
              return
            }
            nestIntoFrame(
              el,
              {
                ...context![el.instanceId],
                pointer: getGlobalPointer(),
                excluded,
                fromDrag: true,
              } as any,
            )
          })
        }
      },
      selectionTransformEnded: () => {
        context = undefined
      },
    },
  }
}, { enforce: 'post' })

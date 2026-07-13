import type { Element2D } from 'modern-canvas'
import type { DragContext } from '../utils'
import { DEG_TO_RAD } from 'modern-canvas'
import { computed } from 'vue'
import { definePlugin } from '../plugin'
import { isFlexContainer } from '../utils/helper'

declare global {
  namespace Mce {
    interface InteractionConfig {
      transform: TransformConfig
    }

    interface TransformConfig {
      handleShape: 'rect' | 'circle'
      handleStyle: '8-points' | '4-points'
      lockAspectRatioStrategy: 'all' | 'diagonal'
      rotator: boolean
    }

    interface TransformValue {
      left: number
      top: number
      width: number
      height: number
      rotate: number
      borderRadius: number
    }

    type TransformHandleDirection = 't' | 'l' | 'r' | 'b'
    type TransformHandleCorner = 'tl' | 'tr' | 'bl' | 'br'
    type TransformHandle
      = | 'move'
        | `resize-${TransformHandleDirection | TransformHandleCorner}`
        | `rotate-${TransformHandleCorner}`
        | `round-${TransformHandleCorner}`

    interface TransformContext extends DragContext {
      handle: TransformHandle
      value: TransformValue
      oldValue: TransformValue
    }

    type MoveDirection = 'left' | 'top' | 'right' | 'bottom'
    type FlipDirection = 'horizontal' | 'vertical'
    type TransformType = 'move' | 'resize' | 'rotate' | 'round'
    interface TransformOptions {
      event?: MouseEvent
      isCorner?: boolean
      /** resize 时被拖动的方向（t/l/r/b/tl/...），用于缩放吸附定位被拖动的边。 */
      direction?: string
    }

    interface Commands {
      editElement: (event?: MouseEvent) => void
      getTransform: () => TransformValue
      setTransform: (type: TransformType, value: Partial<TransformValue>, options?: TransformOptions) => void
      move: (direction: MoveDirection, distance?: number) => void
      moveLeft: (distance?: number) => void
      moveTop: (distance?: number) => void
      moveRight: (distance?: number) => void
      moveBottom: (distance?: number) => void
      rotate: (deg: number) => void
      rotate90: () => void
      flip: (direction: FlipDirection) => void
      flipHorizontal: () => void
      flipVertical: () => void
    }

    interface Hotkeys {
      editElement: [event: KeyboardEvent]
      moveLeft: [event: KeyboardEvent]
      moveTop: [event: KeyboardEvent]
      moveRight: [event: KeyboardEvent]
      moveBottom: [event: KeyboardEvent]
      flipHorizontal: [event: KeyboardEvent]
      flipVertical: [event: KeyboardEvent]
    }
  }
}

export default definePlugin((editor) => {
  const {
    selectionObb,
    selectionAabb,
    elementSelection,
    exec,
    inEditorIs,
    resizeElement,
    state,
    registerConfig,
    enterHandlers,
    snap,
    snapResize,
    isLock,
  } = editor

  registerConfig<Mce.TransformConfig>('interaction.transform', {
    default: {
      handleShape: 'rect',
      handleStyle: '4-points',
      lockAspectRatioStrategy: 'all',
      rotator: true,
    },
  })

  async function editElement(event?: MouseEvent) {
    const els = elementSelection.value
    if (els.length === 1) {
      const el = els[0]
      if (isLock(el)) {
        return // 锁定元素不进入编辑
      }
      // 插件贡献的进入编辑（如 @mce/table 的 tableEditing）优先；命中即停。
      if (enterHandlers.some(h => h(el, editor))) {
        return
      }
      if (el.text.isValid()) {
        // 透传双击坐标：光标落在点击位置（无坐标时——如 Enter 进入——保持全选）。
        await exec('startTyping', event as any)
      }
      else if (el.foreground.isValid()) {
        state.value = 'cropping'
      }
      // Editable vector path: enter node-editing mode (literal `paths`, not svg).
      else if (el.shape.isValid() && el.shape.paths?.length && !el.shape.svg) {
        state.value = 'pathEditing'
      }
    }
  }

  let context: {
    batchRotate: number
    batchResize: Record<number, {
      min: { x: number, y: number }
      max: { x: number, y: number }
      scale: { x: number, y: number }
    }>
    constrainMovement: {
      event?: MouseEvent
      startPoint?: { x: number, y: number }
    }
    // 文字 corner-resize 拖拽期用 transform scale 预览、松手 bake 成 fontSize（见下）。
    textScale?: { el: Element2D, origW: number, origH: number }
  } | undefined

  // 文字缩放预览落地：把拖拽期的 transform scale 烘焙成真实 fontSize（一次重排+重栅），
  // 复位 scale=1。Started/Ended 都调，确保拖拽被打断也不会让 el.scale 卡住。
  function bakeTextScale(): void {
    const ts = context?.textScale
    if (!ts) {
      return
    }
    context!.textScale = undefined
    const el = ts.el
    const k = el.scale.x
    if (k === 1) {
      return
    }
    // 拖拽期 style.left 含 pivot·(1-k) 补偿；bake 复位 scale=1 后该补偿失效，故先记下
    // 当前渲染的世界左上角(=拖拽锚点)，bake 完再把 left/top 复位到它，避免锚点跳走。
    const g = el.globalAabb
    const worldLeft = g.min.x
    const worldTop = g.min.y
    el.scale.set(1, 1)
    resizeElement(
      el,
      Math.max(1, ts.origW * k),
      Math.max(1, ts.origH * k),
      { deep: true, textFontSizeToFit: true },
    )
    const parentAabb = el.getParent<Element2D>()?.globalAabb
    el.style.left = worldLeft - (parentAabb?.left ?? 0)
    el.style.top = worldTop - (parentAabb?.top ?? 0)
  }

  function initContext() {
    context = {
      batchRotate: 0,
      batchResize: {},
      constrainMovement: {},
    }
    const aabb = selectionAabb.value
    elementSelection.value.forEach((el) => {
      const elAabb = el.globalAabb
      context!.batchResize[el.instanceId] = {
        min: {
          x: (elAabb.min.x - aabb.min.x) / aabb.width,
          y: (elAabb.min.y - aabb.min.y) / aabb.height,
        },
        max: {
          x: (elAabb.max.x - aabb.min.x) / aabb.width,
          y: (elAabb.max.y - aabb.min.y) / aabb.height,
        },
        scale: {
          x: el.style.width / elAabb.width,
          y: el.style.height / elAabb.height,
        },
      }
    })
  }

  const transform = computed(() => {
    const { left, top, width, height, rotationDegrees } = selectionObb.value
    return {
      left,
      top,
      width,
      height,
      rotate: rotationDegrees,
      borderRadius: elementSelection.value[0]?.style.borderRadius ?? 0,
    }
  })

  function getTransform() {
    return transform.value
  }

  const setTransform: Mce.Commands['setTransform'] = (type, value, options = {}) => {
    const { event, isCorner, direction = '' } = options

    // 锁定元素只能单选且不可变换（含方向键微移 / 缩放 / 旋转 / 批量），直接跳过。
    if (elementSelection.value.some(el => isLock(el))) {
      return
    }

    if (!context) {
      initContext()
    }
    const _context = context!

    const oldTransform = getTransform()
    const transform = {
      ...oldTransform,
      ...value,
    }
    const els = elementSelection.value
    const isMultiple = els.length > 1

    // A child of a flex/auto-layout container is positioned by the layout
    // engine, so dragging it must reorder it among its siblings rather than set
    // left/top. The reordering + insertion indicator live in the flexLayout
    // plugin; here we just skip the absolute move.
    if (type === 'move' && els.length === 1) {
      const parent = els[0].getParent<Element2D>()
      if (parent && isFlexContainer(parent)) {
        return
      }
    }

    if (type === 'move') {
      transform.left = Math.round(transform.left)
      transform.top = Math.round(transform.top)

      // Constrain movement
      if (event?.shiftKey) {
        const ctx = _context.constrainMovement
        if (!ctx.event) {
          ctx.event = event
        }
        if (!ctx.startPoint) {
          ctx.startPoint = { x: oldTransform.left, y: oldTransform.top }
        }
        const offset = {
          x: (event?.clientX ?? 0) - (ctx.event?.clientX ?? 0),
          y: (event?.clientY ?? 0) - (ctx.event?.clientY ?? 0),
        }
        if (Math.abs(offset.x) > Math.abs(offset.y)) {
          transform.top = ctx.startPoint.y
        }
        else {
          transform.left = ctx.startPoint.x
        }
      }

      if (!transform.rotate) {
        snap(transform)
      }
    }
    else if (type === 'resize' && !transform.rotate && !isMultiple) {
      // 单选、未旋转时缩放吸附：把被拖动的边对齐到吸附线（角手柄由 snapResize 内部跳过）。
      snapResize(transform, direction)
    }

    const offsetStyle = {
      left: transform.left - oldTransform.left,
      top: transform.top - oldTransform.top,
      width: transform.width - oldTransform.width,
      height: transform.height - oldTransform.height,
      rotate: transform.rotate - oldTransform.rotate,
      borderRadius: transform.borderRadius - oldTransform.borderRadius,
    }

    if (isMultiple) {
      if (type === 'rotate') {
        offsetStyle.rotate = transform.rotate - _context.batchRotate
        _context.batchRotate += offsetStyle.rotate
      }
    }

    els.forEach((el) => {
      const style = el.style

      // 切 Fixed sizing（Figma auto-layout）：flex 子 / 容器的 width/height 可能是 'auto'(Hug) 或由
      // Fill(flexGrow) 撑开——resize 时固化为具体值并脱离 Fill，让 resize 的尺寸权威（否则被父 flex
      // 布局 / 自身 hug 覆盖，且 'auto' + offset = NaN）。style.width 是 content-box、globalAabb 含
      // padding，故固化时减去 padding，resize 才精确（render = value，不多出一圈 padding）。
      if (type === 'resize') {
        const g = el.globalAabb
        const s = style as any
        const num = (v: any): number => (typeof v === 'number' ? v : (Number.parseFloat(v) || 0))
        // 每边优先取单边 paddingX，回退到 padding 简写（demo 常用 style.padding: 20）。
        const pad = (side: string): number => num(s[`padding${side}`] ?? s.padding)
        if (typeof s.width !== 'number')
          s.width = Math.max(0, g.width - pad('Left') - pad('Right'))
        if (typeof s.height !== 'number')
          s.height = Math.max(0, g.height - pad('Top') - pad('Bottom'))
        if (s.flexGrow)
          s.flexGrow = 0
        if (s.flex)
          s.flex = undefined
      }

      const newStyle = {
        left: style.left + offsetStyle.left,
        top: style.top + offsetStyle.top,
        width: style.width + offsetStyle.width,
        height: style.height + offsetStyle.height,
        rotate: ((style.rotate + offsetStyle.rotate) + 360) % 360,
        borderRadius: Math.round(style.borderRadius + offsetStyle.borderRadius),
      }

      if (type === 'rotate') {
        if (isMultiple) {
          const center = el.globalAabb.getCenter().rotate(
            offsetStyle.rotate * DEG_TO_RAD,
            {
              x: transform.left + transform.width / 2,
              y: transform.top + transform.height / 2,
            },
          )
          const parentAabb = el.getParent<Element2D>()?.globalAabb
          if (parentAabb) {
            center.x -= parentAabb.left
            center.y -= parentAabb.top
          }
          newStyle.left = center.x - newStyle.width / 2
          newStyle.top = center.y - newStyle.height / 2
        }
        newStyle.rotate = Math.round(newStyle.rotate * 100) / 100
      }
      else if (type === 'resize') {
        // 文字块角手柄缩放（等比、单选、未旋转、未预缩放）：拖拽期只改元素的 transform
        // scale——字形 atlas 按逻辑 fontSize 缓存，缩放走 GPU（与 zoom 同路径），不必每帧
        // 按新字号重栅格化整段（那是 30fps 掉帧的根因）。fontSize 的实际改写推迟到松手时
        // 在 selectionTransformEnded 里 bake 一次，保证静止后字形清晰。
        const isTextScale = !isMultiple && isCorner && !transform.rotate
          && el.text?.isValid?.() && !el.shape?.isValid?.()
          && el.scale.x === 1 && el.scale.y === 1
        if (isTextScale || _context.textScale?.el === el) {
          const ts = (_context.textScale ??= { el, origW: style.width, origH: style.height })
          const k = ts.origW > 0 ? transform.width / ts.origW : 1
          el.scale.set(k, k)
          // scale 绕元素中心(pivot)缩放，故要让渲染框(globalAabb)贴合目标框(transform——锚点
          // 已由 Transform.vue 固定)，style.left/top 须补偿 pivot·(1-k)：aabb 左上 = left + pivot·(1-k)。
          // 用「目标框 + 当前 k」绝对计算，不能沿用增量 newStyle.left（会用上一帧的 scale、逐帧
          // 累积漂移 → 锚点跑掉）。布局宽高/字号保持不变（拖拽期不重排/重栅）。
          const parentAabb = el.getParent<Element2D>()?.globalAabb
          style.left = (transform.left - (parentAabb?.left ?? 0)) - el.pivot.x * (1 - k)
          style.top = (transform.top - (parentAabb?.top ?? 0)) - el.pivot.y * (1 - k)
          return
        }

        if (isMultiple) {
          const ctx = _context.batchResize[el.instanceId]
          if (ctx) {
            const min = {
              x: transform.left + transform.width * ctx.min.x,
              y: transform.top + transform.height * ctx.min.y,
            }
            const max = {
              x: transform.left + transform.width * ctx.max.x,
              y: transform.top + transform.height * ctx.max.y,
            }
            const size = { x: max.x - min.x, y: max.y - min.y }
            const center = { x: min.x + size.x / 2, y: min.y + size.y / 2 }
            const parentAabb = el.getParent<Element2D>()?.globalAabb
            if (parentAabb) {
              center.x -= parentAabb.left
              center.y -= parentAabb.top
            }
            newStyle.width = size.x * ctx.scale.x
            newStyle.height = size.y * ctx.scale.y
            newStyle.left = center.x - newStyle.width / 2
            newStyle.top = center.y - newStyle.height / 2
          }
        }

        const roundFactor = newStyle.rotate ? 100 : 1

        // flex / auto-layout 容器：子的尺寸由布局决定，绝不能 deep-resize 子——deep 会按比例缩放
        // 每个子，叠加到 flex 布局上，子的高/宽会爆炸（含文字子时尤其明显）。这里只改容器自身尺寸
        // （下面 Object.assign(style, newStyle)），flex 会自行重排子。
        if (!isFlexContainer(el)) {
          resizeElement(
            el,
            Math.max(1, Math.round(newStyle.width * roundFactor) / roundFactor),
            Math.max(1, Math.round(newStyle.height * roundFactor) / roundFactor),
            inEditorIs(el, 'Frame')
              ? undefined
              : el.shape.isValid()
                ? { deep: true }
                : isCorner
                  ? { deep: true, textFontSizeToFit: true }
                  : { deep: true, textToFit: true },
          )

          newStyle.width = el.style.width
          newStyle.height = el.style.height
        }
      }

      Object.assign(style, newStyle)
    })
  }

  const move: Mce.Commands['move'] = (direction, distance = 1) => {
    let prop: 'left' | 'top'
    switch (direction) {
      case 'left':
      case 'top':
        prop = direction
        distance = -distance
        break
      case 'bottom':
        prop = 'top'
        break
      case 'right':
        prop = 'left'
        break
    }
    elementSelection.value.forEach((element) => {
      element.style[prop] += distance
    })
  }

  const rotate: Mce.Commands['rotate'] = (deg) => {
    elementSelection.value.forEach((el) => {
      el.style.rotate = ((el.style.rotate + deg) % 360 + 360) % 360
    })
  }

  const flip: Mce.Commands['flip'] = (direction) => {
    switch (direction) {
      case 'horizontal':
        elementSelection.value.forEach((el) => {
          el.style.scaleX = -el.style.scaleX
        })
        break
      case 'vertical':
        elementSelection.value.forEach((el) => {
          el.style.scaleY = -el.style.scaleY
        })
        break
    }
  }

  return {
    name: 'mce:transform',
    commands: [
      { command: 'editElement', handle: editElement },
      { command: 'getTransform', handle: getTransform },
      { command: 'setTransform', handle: setTransform },
      { command: 'move', handle: move },
      { command: 'moveLeft', handle: (distance?: number) => move('left', distance) },
      { command: 'moveTop', handle: (distance?: number) => move('top', distance) },
      { command: 'moveRight', handle: (distance?: number) => move('right', distance) },
      { command: 'moveBottom', handle: (distance?: number) => move('bottom', distance) },
      { command: 'rotate', handle: rotate },
      { command: 'rotate90', handle: () => rotate(90) },
      { command: 'flip', handle: flip },
      { command: 'flipHorizontal', handle: () => flip('horizontal') },
      { command: 'flipVertical', handle: () => flip('vertical') },
    ],
    hotkeys: [
      { command: 'editElement', key: 'Enter', when: () => elementSelection.value.length > 0 },
      { command: 'moveLeft', key: 'ArrowLeft', editable: false, when: () => elementSelection.value.length > 0 },
      { command: 'moveTop', key: 'ArrowUp', editable: false, when: () => elementSelection.value.length > 0 },
      { command: 'moveRight', key: 'ArrowRight', editable: false, when: () => elementSelection.value.length > 0 },
      { command: 'moveBottom', key: 'ArrowDown', editable: false, when: () => elementSelection.value.length > 0 },
      { command: 'flipHorizontal', key: 'Shift+H' },
      { command: 'flipVertical', key: 'Shift+V' },
    ],
    events: {
      selectionTransformStarted: () => {
        bakeTextScale() // 防御：上一次拖拽若未正常结束，先落地再重开
        initContext()
      },
      selectionTransformed: (ctx) => {
        const { handle, value, event } = ctx
        const [type, direction = ''] = handle.split('-')
        const isCorner = direction.length > 1
        setTransform(type as Mce.TransformType, value, {
          event,
          isCorner,
          direction,
        })
      },
      selectionTransformEnded: () => {
        bakeTextScale()
        context = undefined
      },
    },
  }
})

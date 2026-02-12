import type { Element2D } from 'modern-canvas'
import type { DragContext } from '../utils'
import { DEG_TO_RAD } from 'modern-canvas'
import { computed } from 'vue'
import { definePlugin } from '../plugin'

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
    }

    interface Commands {
      enter: () => void
      getTransform: () => TransformValue
      setTransform: (type: TransformType, value: Partial<TransformValue>, options?: TransformOptions) => void
      move: (direction: MoveDirection, distance?: number) => void
      moveLeft: (distance?: number) => void
      moveTop: (distance?: number) => void
      moveRight: (distance?: number) => void
      moveBottom: (distance?: number) => void
      flip: (direction: FlipDirection) => void
      flipHorizontal: () => void
      flipVertical: () => void
    }

    interface Hotkeys {
      enter: [event: KeyboardEvent]
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
  } = editor

  registerConfig<Mce.TransformConfig>('interaction.transform', {
    default: {
      handleShape: 'rect',
      handleStyle: '4-points',
      lockAspectRatioStrategy: 'all',
      rotator: true,
    },
  })

  async function enter() {
    const els = elementSelection.value
    if (els.length === 1) {
      const el = els[0]
      if (el.text.isValid()) {
        await exec('startTyping')
      }
      else if (el.foreground.isValid()) {
        state.value = 'cropping'
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
  } | undefined

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

  function onSelectionTransformStart(): void {
    initContext()
  }

  function onSelectionTransformEnd(): void {
    context = undefined
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
    const { event, isCorner } = options

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
        transform.left = exec('snap', 'x', transform.left)
        transform.top = exec('snap', 'y', transform.top)
      }
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

        const scale = newStyle.rotate ? 100 : 1

        resizeElement(
          el,
          Math.max(1, Math.round(newStyle.width * scale) / scale),
          Math.max(1, Math.round(newStyle.height * scale) / scale),
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
      { command: 'enter', handle: enter },
      { command: 'getTransform', handle: getTransform },
      { command: 'setTransform', handle: setTransform },
      { command: 'move', handle: move },
      { command: 'moveLeft', handle: (distance?: number) => move('left', distance) },
      { command: 'moveTop', handle: (distance?: number) => move('top', distance) },
      { command: 'moveRight', handle: (distance?: number) => move('right', distance) },
      { command: 'moveBottom', handle: (distance?: number) => move('bottom', distance) },
      { command: 'flip', handle: flip },
      { command: 'flipHorizontal', handle: () => flip('horizontal') },
      { command: 'flipVertical', handle: () => flip('vertical') },
    ],
    hotkeys: [
      { command: 'enter', key: 'Enter', when: () => elementSelection.value.length > 0 },
      { command: 'moveLeft', key: 'ArrowLeft', editable: false, when: () => elementSelection.value.length > 0 },
      { command: 'moveTop', key: 'ArrowUp', editable: false, when: () => elementSelection.value.length > 0 },
      { command: 'moveRight', key: 'ArrowRight', editable: false, when: () => elementSelection.value.length > 0 },
      { command: 'moveBottom', key: 'ArrowDown', editable: false, when: () => elementSelection.value.length > 0 },
      { command: 'flipHorizontal', key: 'Shift+H' },
      { command: 'flipVertical', key: 'Shift+V' },
    ],
    events: {
      selectionTransformStart: onSelectionTransformStart,
      selectionTransform: (ctx) => {
        const { handle, value, event } = ctx
        const [type, direction = ''] = handle.split('-')
        const isCorner = direction.length > 1
        setTransform(type as Mce.TransformType, value, {
          event,
          isCorner,
        })
      },
      selectionTransformEnd: onSelectionTransformEnd,
    },
  }
})

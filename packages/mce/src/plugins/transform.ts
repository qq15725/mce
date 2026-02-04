import type { Element2D } from 'modern-canvas'
import { DEG_TO_RAD } from 'modern-canvas'
import { computed } from 'vue'
import { definePlugin } from '../plugin'

declare global {
  namespace Mce {
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

    type FlipType = 'horizontal' | 'vertical'

    interface Commands {
      enter: () => void
      getTransformValue: () => TransformValue
      transform: (handle: Mce.TransformHandle, value: Partial<TransformValue>) => void
      flip: (type: Mce.FlipType) => void
      flipHorizontal: () => void
      flipVertical: () => void
    }

    interface Hotkeys {
      enter: [event: KeyboardEvent]
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
  } = editor

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

  const transformCtx = {
    rotate: 0,
    resize: {} as Record<number, {
      minX: number
      minY: number
      maxX: number
      maxY: number
      scaleX: number
      scaleY: number
    }>,
  }

  const transformValue = computed(() => {
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

  function onSelectionTransformStart(): void {
    const aabb = selectionAabb.value
    elementSelection.value.forEach((el) => {
      const elAabb = el.globalAabb
      transformCtx.resize[el.instanceId] = {
        minX: (elAabb.min.x - aabb.min.x) / aabb.width,
        minY: (elAabb.min.y - aabb.min.y) / aabb.height,
        maxX: (elAabb.max.x - aabb.min.x) / aabb.width,
        maxY: (elAabb.max.y - aabb.min.y) / aabb.height,
        scaleX: el.style.width / elAabb.width,
        scaleY: el.style.height / elAabb.height,
      }
    })
  }

  function onSelectionTransformEnd(): void {
    transformCtx.rotate = 0
    transformCtx.resize = {}
  }

  function transform(
    handle: Mce.TransformHandle,
    partialTransform: Partial<Mce.TransformValue>,
  ): void {
    const oldTransform = transformValue.value
    const transform = {
      ...oldTransform,
      ...partialTransform,
    }
    const [type, direction = ''] = handle.split('-')
    const isCorner = direction.length > 1
    const els = elementSelection.value
    const isMultiple = els.length > 1

    if (type === 'move') {
      transform.left = Math.round(transform.left)
      transform.top = Math.round(transform.top)
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
        offsetStyle.rotate = transform.rotate - transformCtx.rotate
        transformCtx.rotate += offsetStyle.rotate
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
          const ctx = transformCtx.resize[el.instanceId]
          if (ctx) {
            const min = {
              x: transform.left + transform.width * ctx.minX,
              y: transform.top + transform.height * ctx.minY,
            }
            const max = {
              x: transform.left + transform.width * ctx.maxX,
              y: transform.top + transform.height * ctx.maxY,
            }
            const size = { x: max.x - min.x, y: max.y - min.y }
            const center = { x: min.x + size.x / 2, y: min.y + size.y / 2 }
            const parentAabb = el.getParent<Element2D>()?.globalAabb
            if (parentAabb) {
              center.x -= parentAabb.left
              center.y -= parentAabb.top
            }
            newStyle.width = size.x * ctx.scaleX
            newStyle.height = size.y * ctx.scaleY
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

      el.updateGlobalTransform()
    })
  }

  function flip(type: Mce.FlipType) {
    switch (type) {
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
      { command: 'getTransformValue', handle: () => transformValue.value },
      { command: 'transform', handle: transform },
      { command: 'flip', handle: flip },
      { command: 'flipHorizontal', handle: () => flip('horizontal') },
      { command: 'flipVertical', handle: () => flip('vertical') },
    ],
    hotkeys: [
      { command: 'enter', key: ['Enter'], when: () => elementSelection.value.length > 0 },
      { command: 'flipHorizontal', key: 'Shift+H' },
      { command: 'flipVertical', key: 'Shift+V' },
    ],
    events: {
      selectionTransformStart: onSelectionTransformStart,
      selectionTransform: ctx => transform(ctx.handle, ctx.value),
      selectionTransformEnd: onSelectionTransformEnd,
    },
  }
})

import type { Element2D } from 'modern-canvas'
import { Aabb2D } from 'modern-canvas'
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
    getAabb,
  } = editor

  async function enter() {
    if (elementSelection.value.length === 1) {
      const element = elementSelection.value[0]
      if (element.text.isValid()) {
        await exec('startTyping')
      }
    }
  }

  const startState = {
    rotate: 0,
    offsetMap: {} as Record<number, { x: number, y: number }>,
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

  function transform(
    handle: Mce.TransformHandle,
    partialValue: Partial<Mce.TransformValue>,
  ): void {
    const oldValue = transformValue.value
    const value = {
      ...oldValue,
      ...partialValue,
    }
    const [type, direction = ''] = handle.split('-')
    const isCorner = direction.length > 1

    if (type === 'move') {
      value.left = exec('snap', 'x', Math.round(value.left))
      value.top = exec('snap', 'y', Math.round(value.top))
    }

    const offsetStyle = {
      left: value.left - oldValue.left,
      top: value.top - oldValue.top,
      width: value.width - oldValue.width,
      height: value.height - oldValue.height,
      rotate: value.rotate - oldValue.rotate,
      borderRadius: value.borderRadius - oldValue.borderRadius,
    }

    const els = elementSelection.value

    if (els.length > 1) {
      if (type === 'rotate') {
        offsetStyle.rotate = value.rotate - startState.rotate
        startState.rotate += offsetStyle.rotate
      }
    }

    els.forEach((el) => {
      const style = el.style

      const newStyle = {
        left: style.left + offsetStyle.left,
        top: style.top + offsetStyle.top,
        width: style.width + offsetStyle.width,
        height: style.height + offsetStyle.height,
        rotate: (style.rotate + offsetStyle.rotate + 360) % 360,
        borderRadius: Math.round(style.borderRadius + offsetStyle.borderRadius),
      }

      if (type === 'rotate') {
        newStyle.rotate = Math.round(newStyle.rotate * 100) / 100
      }
      else if (type === 'resize') {
        const scale = newStyle.rotate ? 100 : 1
        const newWidth = Math.max(1, Math.round(newStyle.width * scale) / scale)
        const newHeight = Math.max(1, Math.round(newStyle.height * scale) / scale)
        const shape = el.shape
        resizeElement(
          el,
          newWidth,
          newHeight,
          inEditorIs(el, 'Frame')
            ? undefined
            : shape.isValid()
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

    if (els.length > 1) {
      if (type === 'resize') {
        const selectionAabb = getAabb(els)
        els.forEach((el) => {
          const parentAabb = el.getParent<Element2D>()?.globalAabb ?? new Aabb2D()
          const { x, y } = startState.offsetMap[el.instanceId]!
          el.style.left = selectionAabb.left - parentAabb.left + selectionAabb.width * x
          el.style.top = selectionAabb.top - parentAabb.left + selectionAabb.height * y
        })
      }
    }
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
      selectionTransformStart: () => {
        const aabb = selectionAabb.value
        elementSelection.value.forEach((el) => {
          const elAabb = el.globalAabb
          startState.offsetMap[el.instanceId] = {
            x: (elAabb.x - aabb.x) / aabb.width,
            y: (elAabb.y - aabb.y) / aabb.height,
          }
        })
      },
      selectionTransform: ctx => transform(ctx.handle, ctx.value),
      selectionTransformEnd: () => {
        startState.rotate = 0
        startState.offsetMap = {}
      },
    },
  }
})

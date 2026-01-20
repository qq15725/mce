<script setup lang="ts">
import type { OrientedBoundingBox } from '../../types'
import { computed, getCurrentInstance, h, nextTick, onMounted, ref, useModel } from 'vue'

export interface TransformableValue extends OrientedBoundingBox {
  borderRadius: number
}

interface Point {
  x: number
  y: number
}

type Handle
  = | 'move'
    | 'resize-t'
    | 'resize-r'
    | 'resize-b'
    | 'resize-l'
    | 'resize-tl'
    | 'resize-tr'
    | 'resize-bl'
    | 'resize-br'
    | 'rotate-tl'
    | 'rotate-tr'
    | 'rotate-bl'
    | 'rotate-br'
    | 'round-tl'
    | 'round-tr'
    | 'round-bl'
    | 'round-br'

interface HandleObject {
  type: Handle
  shape?: 'rect' | 'circle'
  x: number
  y: number
  width: number
  height: number
}

const props = withDefaults(defineProps<{
  tag?: string | any
  modelValue?: Partial<TransformableValue>
  movable?: boolean
  rotatable?: boolean
  rotator?: boolean
  resizable?: boolean
  roundable?: boolean
  threshold?: number
  resizeStrategy?: 'lockAspectRatio' | 'lockAspectRatioDiagonal'
  handleStrategy?: 'point'
  handleShape?: 'rect' | 'circle'
  hideUi?: boolean
  handles?: Handle[]
  initialSize?: boolean
  borderStyle?: 'solid' | 'dashed'
  tipFormat?: (type: 'size') => string
}>(), {
  tag: 'div',
  movable: true,
  rotatable: true,
  resizable: true,
  threshold: 0,
  handleShape: 'rect',
  handles: () => [
    'move',
    // resize
    'resize-l',
    'resize-t',
    'resize-r',
    'resize-b',
    'resize-tl',
    'resize-tr',
    'resize-br',
    'resize-bl',
    // round
    'round-tl',
    'round-tr',
    'round-bl',
    'round-br',
    // rotate
    'rotate-tl',
    'rotate-tr',
    'rotate-bl',
    'rotate-br',
  ] as Handle[],
})

const emit = defineEmits<{
  'update:modelValue': [TransformableValue]
  'start': [TransformableValue]
  'move': [TransformableValue, TransformableValue]
  'end': [TransformableValue]
}>()

const cursors: Record<string, any> = {
  'rotate-tl': (angle: number) => createCursor('rotate', 360 + angle),
  'rotate-tr': (angle: number) => createCursor('rotate', 90 + angle),
  'rotate-bl': (angle: number) => createCursor('rotate', 270 + angle),
  'rotate-br': (angle: number) => createCursor('rotate', 180 + angle),
  'resize-l': (angle: number) => createCursor('resizeXy', 180 + angle),
  'resize-t': (angle: number) => createCursor('resizeXy', 90 + angle),
  'resize-r': (angle: number) => createCursor('resizeXy', 180 + angle),
  'resize-b': (angle: number) => createCursor('resizeXy', 90 + angle),
  'resize-tl': (angle: number) => createCursor('resizeBevel', 90 + angle),
  'resize-tr': (angle: number) => createCursor('resizeBevel', 180 + angle),
  'resize-br': (angle: number) => createCursor('resizeBevel', 90 + angle),
  'resize-bl': (angle: number) => createCursor('resizeBevel', 180 + angle),
}

const modelValue = useModel(props, 'modelValue')
const model = computed({
  get: () => {
    let { left = 0, top = 0, width = 0, height = 0, rotate = 0, borderRadius = 0 } = modelValue.value ?? {}
    if (Number.isNaN(Number(width)))
      width = 0
    if (Number.isNaN(Number(height)))
      height = 0
    return { left, top, width, height, rotate, borderRadius }
  },
  set: val => modelValue.value = val,
})
const transforming = ref(false)
const activeHandle = ref<Handle>()
const computedHandles = computed<HandleObject[]>(() => {
  const shape = props.handleShape
  const size = shape === 'rect' ? 8 : 10
  const { width = 0, height = 0, borderRadius } = model.value
  const center = { x: width / 2, y: height / 2 }
  const lines = [
    { type: 't', points: [[0, 0], [1, 0]] },
    { type: 'r', points: [[1, 0], [1, 1]] },
    { type: 'b', points: [[0, 1], [1, 1]] },
    { type: 'l', points: [[0, 0], [0, 1]] },
  ]
  const points = [
    { type: 't', point: [0.5, 0], width: 1.4, height: 0.6 },
    { type: 'r', point: [1, 0.5], width: 0.6, height: 1.4 },
    { type: 'b', point: [0.5, 1], width: 1.4, height: 0.6 },
    { type: 'l', point: [0, 0.5], width: 0.6, height: 1.4 },
    { type: 'tl', point: [0, 0] },
    { type: 'tr', point: [1, 0] },
    { type: 'bl', point: [0, 1] },
    { type: 'br', point: [1, 1] },
  ]

  const lineHandles = lines.map((item) => {
    const [p1, p2] = item.points
    const minX = Math.min(p1[0], p2[0]) * width
    const maxX = Math.max(p1[0], p2[0]) * width
    const minY = Math.min(p1[1], p2[1]) * height
    const maxY = Math.max(p1[1], p2[1]) * height
    return {
      type: item.type,
      x: minX - size / 2,
      y: minY - size / 2,
      width: (maxX - minX) + size,
      height: (maxY - minY) + size,
    }
  })

  const pointHandles = points.map((item) => {
    const _w = size * (item.width ?? 1)
    const _h = size * (item.height ?? 1)
    return {
      type: item.type,
      shape,
      x: item.point[0] * width - _w / 2,
      y: item.point[1] * height - _h / 2,
      width: _w,
      height: _h,
    }
  })

  const diagonalPointHandles = pointHandles
    .filter(item => item.type.length === 2)

  const rotateHandles = diagonalPointHandles
    .map((item) => {
      const _w = item.width * 1.5
      const _h = item.height * 1.5
      let x = item.x
      let y = item.y
      if (center.x > item.x) {
        x -= _w
      }
      else {
        x += item.width
      }
      if (center.y > item.y) {
        y -= _h
      }
      else {
        y += item.height
      }
      return {
        ...item,
        shape: undefined,
        type: `rotate-${item.type}`,
        x,
        y,
        width: _w,
        height: _h,
      }
    })
  const minSize = Math.min(width, height)
  const roundedHandles = props.roundable
    ? diagonalPointHandles
        .map((item) => {
          const _w = item.width * 0.8
          const _h = item.height * 0.8
          const sign = {
            x: center.x - item.x > 0 ? 1 : -1,
            y: center.y - item.y > 0 ? 1 : -1,
          }
          const offset = minSize * 0.1
          const ws = (borderRadius + offset) / (width / 2 + offset)
          const hs = (borderRadius + offset) / (height / 2 + offset)
          return {
            ...item,
            shape: 'circle',
            type: `round-${item.type}`,
            x: item.x + sign.x * width / 2 * ws,
            y: item.y + sign.y * height / 2 * hs,
            width: _w,
            height: _h,
          }
        })
    : []

  let handles
  if (props.handleStrategy === 'point') {
    handles = [
      // move
      ...lineHandles.map(item => ({ ...item, type: 'move' })),
      // resize
      ...pointHandles.map(item => ({ ...item, type: `resize-${item.type}` })),
      // round
      ...roundedHandles,
      // rotate
      ...rotateHandles,
    ]
  }
  else {
    handles = [
      // resize
      ...lineHandles.map(item => ({ ...item, type: `resize-${item.type}` })),
      ...diagonalPointHandles.map(item => ({ ...item, type: `resize-${item.type}` })),
      // round
      ...roundedHandles,
      // rotate
      ...rotateHandles,
    ]
  }

  return handles
    .filter((handle) => {
      if (props.handles.includes(handle.type as Handle)) {
        return !(
          (!props.resizable && handle.type.startsWith('resize'))
          || (!props.rotatable && handle.type.startsWith('rotate'))
          || (!props.movable && handle.type === 'move')
        )
      }
      return false
    })
    .map((anchor) => {
      anchor.width = Math.max(anchor.width, 0)
      anchor.height = Math.max(anchor.height, 0)
      return anchor
    }) as HandleObject[]
})
const handlesRef = ref<HTMLElement[]>()
const sizeStyle = computed(() => {
  const { width = 0, height = 0 } = model.value
  return {
    width: props.initialSize && !width ? undefined : `${width}px`,
    height: props.initialSize && !height ? undefined : `${height}px`,
  }
})
const style = computed(() => {
  const { left = 0, top = 0, rotate = 0 } = model.value
  const radian = rotate * Math.PI / 180
  const cos = Math.cos(radian)
  const sin = Math.sin(radian)
  return {
    ...sizeStyle.value,
    transform: `matrix(${cos}, ${sin}, ${-sin}, ${cos}, ${left}, ${top})`,
  }
})
const tip = computed(() => props.tipFormat?.('size'))

function start(event?: MouseEvent, index?: number): boolean {
  if (event && event.button !== undefined && event.button !== 0) {
    return false
  }

  event?.preventDefault()
  event?.stopPropagation()

  const { left, top, width, height, rotate, borderRadius } = model.value

  let aspectRatio = 0
  if (width && height) {
    aspectRatio = width / height
  }

  const handle = index === undefined
    ? { type: 'move', x: 0, y: 0, width: 0, height: 0 } as HandleObject
    : computedHandles.value[index]

  activeHandle.value = handle.type
  const handleArr = handle.type.split('-')
  const last = handleArr.length > 1 ? (handleArr.pop() || '') : ''
  const key = handleArr.join('-')

  const isMove = key === 'move'
  const isRotate = key === 'rotate'
  const isRound = key === 'round'
  const isHorizontal = last === 'l' || last === 'r'
  const isHorizontalVertical = last.length === 1

  const centerPoint = {
    x: left + width / 2,
    y: top + height / 2,
  }

  const startPoint = {
    x: left,
    y: top,
  }

  if (!isMove) {
    startPoint.x += handle.x + handle.width / 2
    startPoint.y += handle.y + handle.height / 2
  }

  const sign = {
    x: startPoint.x - centerPoint.x > 0 ? 1 : -1,
    y: startPoint.y - centerPoint.y > 0 ? 1 : -1,
  }

  const rotatedStartPoint = rotatePoint(startPoint, centerPoint, rotate)

  const rotatedSymmetricPoint = {
    x: centerPoint.x * 2 - rotatedStartPoint.x,
    y: centerPoint.y * 2 - rotatedStartPoint.y,
  }

  const startAngle = Math.atan2(
    rotatedStartPoint.y - centerPoint.y,
    rotatedStartPoint.x - centerPoint.x,
  ) / (Math.PI / 180)

  let startClientPoint: { x: number, y: number } | undefined = event
    ? { x: event.clientX, y: event.clientY }
    : undefined

  function startTransform() {
    transforming.value = true
    emit('start', model.value)
  }

  if (!props.threshold && !transforming.value) {
    startTransform()
  }

  function _onPointerMove(event: MouseEvent): void {
    const updated = {} as TransformableValue

    if (!startClientPoint) {
      startClientPoint = { x: event.clientX, y: event.clientY }
    }

    const rotatedOffset = {
      x: event.clientX - startClientPoint.x,
      y: event.clientY - startClientPoint.y,
    }

    if (!transforming.value) {
      if (
        Math.abs(rotatedOffset.x) < props.threshold
        && Math.abs(rotatedOffset.y) < props.threshold
      ) {
        return
      }

      startTransform()
    }

    const rotatedCurrentPoint = {
      x: rotatedStartPoint.x + rotatedOffset.x,
      y: rotatedStartPoint.y + rotatedOffset.y,
    }

    if (isMove) {
      if (props.movable) {
        updated.left = startPoint.x + rotatedOffset.x
        updated.top = startPoint.y + rotatedOffset.y
      }
    }
    else if (isRotate) {
      if (props.rotatable) {
        const endAngle = Math.atan2(
          rotatedCurrentPoint.y - centerPoint.y,
          rotatedCurrentPoint.x - centerPoint.x,
        ) / (Math.PI / 180)

        updated.rotate = rotate + endAngle - startAngle
      }
    }
    else if (isRound) {
      const offset = rotatePoint(rotatedOffset, { x: 0, y: 0 }, -rotate)
      const dx = -sign.x * offset.x
      const dy = -sign.y * offset.y
      const _offset = dx < dy ? dy : dx
      updated.borderRadius = borderRadius + _offset
    }
    else if (isHorizontalVertical) {
      const currentPoint = rotatePoint(rotatedCurrentPoint, centerPoint, -rotate)
      const newCurrentPoint = isHorizontal
        ? { x: currentPoint.x, y: startPoint.y }
        : { x: startPoint.x, y: currentPoint.y }
      const newRotatedCurrentPoint = rotatePoint(newCurrentPoint, centerPoint, rotate)
      const distance = Math.abs(getDistance(newRotatedCurrentPoint, rotatedSymmetricPoint))
      if (isHorizontal) {
        updated.width = distance
        if (props.resizeStrategy === 'lockAspectRatio' && aspectRatio) {
          updated.height = distance / aspectRatio
        }
        else {
          updated.height = height
        }
      }
      else {
        updated.height = distance
        if (props.resizeStrategy === 'lockAspectRatio' && aspectRatio) {
          updated.width = distance * aspectRatio
        }
        else {
          updated.width = width
        }
      }

      const newCenterPoint = getMidpoint(newRotatedCurrentPoint, rotatedSymmetricPoint)

      updated.left = newCenterPoint.x - (updated.width / 2)
      updated.top = newCenterPoint.y - (updated.height / 2)
    }
    else {
      let newRotatedCurrentPoint
      if (
        (
          props.resizeStrategy === 'lockAspectRatio'
          || props.resizeStrategy === 'lockAspectRatioDiagonal'
        ) && aspectRatio
      ) {
        const offset = rotatePoint(rotatedOffset, { x: 0, y: 0 }, -rotate)
        const dx = sign.x * offset.x
        const dy = sign.y * offset.y
        let newCurrentPoint
        if (dx > dy * aspectRatio) {
          newCurrentPoint = {
            x: startPoint.x + sign.x * dx,
            y: startPoint.y + sign.y * dx / aspectRatio,
          }
        }
        else {
          newCurrentPoint = {
            x: startPoint.x + sign.x * dy * aspectRatio,
            y: startPoint.y + sign.y * dy,
          }
        }
        newRotatedCurrentPoint = rotatePoint(newCurrentPoint, centerPoint, rotate)
      }
      else {
        newRotatedCurrentPoint = rotatedCurrentPoint
      }

      const newCenterPoint = getMidpoint(newRotatedCurrentPoint, rotatedSymmetricPoint)

      const points = [
        rotatePoint(newRotatedCurrentPoint, newCenterPoint, -rotate),
        rotatePoint(rotatedSymmetricPoint, newCenterPoint, -rotate),
      ]

      const [minX, maxX] = points[0].x > points[1].x
        ? [points[1].x, points[0].x]
        : [points[0].x, points[1].x]

      const [minY, maxY] = points[0].y > points[1].y
        ? [points[1].y, points[0].y]
        : [points[0].y, points[1].y]

      updated.width = maxX - minX
      updated.height = maxY - minY
      updated.left = minX
      updated.top = minY
    }

    if (
      ('width' in updated && updated.width <= 0)
      || ('height' in updated && updated.height <= 0)
    ) {
      return
    }

    if (updated.borderRadius ?? borderRadius) {
      updated.borderRadius = Math.min(
        Math.max(0, updated.borderRadius ?? borderRadius),
        Math.min((updated.width ?? width) / 2, (updated.height ?? height) / 2),
      )
    }

    const oldValue = { ...model.value }
    const newValue = { ...model.value, ...updated }

    model.value = newValue
    emit('move', newValue, oldValue)
  }

  function _onPointerUp(): void {
    window.removeEventListener('pointermove', _onPointerMove)
    window.removeEventListener('pointerup', _onPointerUp, true)
    transforming.value = false
    activeHandle.value = undefined
    emit('end', model.value)
  }

  window.addEventListener('pointermove', _onPointerMove)
  window.addEventListener('pointerup', _onPointerUp, true)

  return true
}

const cursorMap = {
  rotate: '<path d="M22.4789 9.45728L25.9935 12.9942L22.4789 16.5283V14.1032C18.126 14.1502 14.6071 17.6737 14.5675 22.0283H17.05L13.513 25.543L9.97889 22.0283H12.5674C12.6071 16.5691 17.0214 12.1503 22.4789 12.1031L22.4789 9.45728Z" fill="black"/><path fill-rule="evenodd" clip-rule="evenodd" d="M21.4789 7.03223L27.4035 12.9945L21.4789 18.9521V15.1868C18.4798 15.6549 16.1113 18.0273 15.649 21.0284H19.475L13.5128 26.953L7.55519 21.0284H11.6189C12.1243 15.8155 16.2679 11.6677 21.4789 11.1559L21.4789 7.03223ZM22.4789 12.1031C17.0214 12.1503 12.6071 16.5691 12.5674 22.0284H9.97889L13.513 25.543L17.05 22.0284H14.5675C14.5705 21.6896 14.5947 21.3558 14.6386 21.0284C15.1157 17.4741 17.9266 14.6592 21.4789 14.1761C21.8063 14.1316 22.1401 14.1069 22.4789 14.1032V16.5284L25.9935 12.9942L22.4789 9.45729L22.4789 12.1031Z" fill="white"/>',
  resizeXy: '<path d="m9 17.9907v.005l5.997 5.996.001-3.999h1.999 2.02v4l5.98-6.001-5.98-5.999.001 4.019-2.021.002h-2l.001-4.022zm1.411.003 3.587-3.588-.001 2.587h3.5 2.521v-2.585l3.565 3.586-3.564 3.585-.001-2.585h-2.521l-3.499-.001-.001 2.586z" fill="white"/><path d="m17.4971 18.9932h2.521v2.586l3.565-3.586-3.565-3.585v2.605h-2.521-3.5v-2.607l-3.586 3.587 3.586 3.586v-2.587z" fill="black"/>',
  resizeBevel: '<path d="m19.7432 17.0869-4.072 4.068 2.829 2.828-8.473-.013-.013-8.47 2.841 2.842 4.075-4.068 1.414-1.415-2.844-2.842h8.486v8.484l-2.83-2.827z" fill="white"/><path d="m18.6826 16.7334-4.427 4.424 1.828 1.828-5.056-.016-.014-5.054 1.842 1.841 4.428-4.422 2.474-2.475-1.844-1.843h5.073v5.071l-1.83-1.828z" fill="black"/>',
}

function createCursor(type: 'rotate' | 'resizeXy' | 'resizeBevel', angle: number) {
  const path = cursorMap[type]
  return `<svg height="32" width="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><defs><filter id="shadow" color-interpolation-filters="sRGB"><feDropShadow dx="1" dy="1" stdDeviation="1.2" flood-opacity=".5"/></filter></defs><g fill="none" transform="rotate(${angle} 16 16)" filter="url(%23shadow)">${path}</g></svg>`
    .replace(/"/g, '\'')
}

function getCursor(type: Handle) {
  if (type === 'move') {
    return 'move'
  }
  const create = cursors[type]
  if (!create) {
    return undefined
  }
  return `url("data:image/svg+xml,${create(model.value.rotate ?? 0)}") 16 16, pointer`
}

function rotatePoint(point: Point, origin: Point, angle: number): Point {
  const radian = angle * Math.PI / 180
  const cos = Math.cos(radian)
  const sin = Math.sin(radian)
  return {
    x: (point.x - origin.x) * cos - (point.y - origin.y) * sin + origin.x,
    y: (point.x - origin.x) * sin + (point.y - origin.y) * cos + origin.y,
  }
}

function getMidpoint(point1: Point, point2: Point) {
  return {
    x: (point2.x + point1.x) / 2,
    y: (point2.y + point1.y) / 2,
  }
}

function getDistance(point1: Point, point2: Point) {
  const dx = point2.x - point1.x
  const dy = point2.y - point1.y
  return ((dx + dy) >= 0 ? 1 : -1) * Math.sqrt(dx * dx + dy * dy)
}

onMounted(async () => {
  const vm = getCurrentInstance()
  const root = vm?.proxy?.$el as HTMLElement | undefined
  if (root && props.initialSize) {
    await nextTick()
    let width
    let height
    const style = getComputedStyle(root)
    if (style.width.endsWith('px') && style.height.endsWith('px')) {
      width = Number(style.width.replace('px', ''))
      height = Number(style.height.replace('px', ''))
    }
    else {
      ({ width, height } = root.getBoundingClientRect())
    }
    if (width && height) {
      model.value = { ...model.value, width, height }
    }
    else if ('ResizeObserver' in globalThis) {
      const observer = new ResizeObserver(([entry]) => {
        if (entry.contentRect.width && entry.contentRect.height) {
          model.value = {
            ...model.value,
            width: entry.contentRect.width,
            height: entry.contentRect.height,
          }
          observer.unobserve(root)
        }
      })
      observer.observe(root)
    }
  }
})

defineExpose({
  start,
  activeHandle,
  transforming,
})

function Diagonal() {
  const handle = activeHandle.value

  if (!handle || !handle.startsWith('resize')) {
    return undefined
  }

  switch (props.resizeStrategy) {
    case 'lockAspectRatio':
      //
      break
    case 'lockAspectRatioDiagonal':
      if (handle.split('-').length === 2) {
        return undefined
      }
      break
    default:
      return undefined
  }

  if (
    handle === 'resize-t'
    || handle === 'resize-r'
    || handle === 'resize-tr'
    || handle === 'resize-bl'
  ) {
    return h('line', {
      class: 'mce-transform-controls__diagonal',
      x1: '100%',
      y1: '0',
      x2: '0',
      y2: '100%',
    })
  }
  else if (
    handle === 'resize-l'
    || handle === 'resize-b'
    || handle === 'resize-tl'
    || handle === 'resize-br'
  ) {
    return h('line', {
      class: 'mce-transform-controls__diagonal',
      x1: '0',
      y1: '0',
      x2: '100%',
      y2: '100%',
    })
  }
  return undefined
}
</script>

<template>
  <Component
    :is="tag"
    class="mce-transform-controls"
    :class="[
      transforming && 'mce-transform-controls--transforming',
      props.hideUi && 'mce-transform-controls--hide-ui',
      resizeStrategy && `mce-transform-controls--${resizeStrategy}`,
      activeHandle && `mce-transform-controls--${activeHandle}`,
      activeHandle === 'move' && 'mce-transform-controls--moving',
      activeHandle?.startsWith('resize') && 'mce-transform-controls--resizing',
      activeHandle?.startsWith('rotate') && 'mce-transform-controls--rotateing',
      props.borderStyle && `mce-transform-controls--${props.borderStyle}`,
    ]"
    :style="style"
  >
    <slot
      :value="modelValue"
      :props="{
        onPointerdown: start,
      }"
      :start="start"
    />

    <svg class="mce-transform-controls__svg">
      <rect width="100%" height="100%" fill="none" class="mce-transform-controls__rect" />

      <rect
        class="mce-transform-controls__rect"
        width="100%"
        height="100%"
        fill="none"
        :rx="model.borderRadius"
        :ry="model.borderRadius"
      />

      <Diagonal />

      <g pointer-events="none">
        <template
          v-for="(handle, index) in computedHandles"
          :key="index"
        >
          <template
            v-if="handle.shape"
          >
            <rect
              v-if="handle.shape === 'rect'"
              :x="handle.x"
              :y="handle.y"
              :width="handle.width"
              :height="handle.height"
              :aria-label="handle.type"
              class="mce-transform-controls__handle"
            />

            <circle
              v-else-if="handle.width === handle.height"
              :cx="handle.x + handle.width / 2"
              :cy="handle.y + handle.width / 2"
              :r="handle.width / 2"
              :aria-label="handle.type"
              class="mce-transform-controls__handle"
            />

            <rect
              v-else
              :x="handle.x"
              :y="handle.y"
              :width="handle.width"
              :height="handle.height"
              :aria-label="handle.type"
              :rx="handle.width / 4"
              :ry="handle.height / 4"
              class="mce-transform-controls__handle"
            />
          </template>
        </template>

        <g
          v-if="rotator"
          :transform="`matrix(1, 0, 0, 1, -32, ${model.height}) rotate(270 16 16)`"
          class="mce-transform-controls__rotator"
        >
          <path
            d="M22.4789 9.45728L25.9935 12.9942L22.4789 16.5283V14.1032C18.126 14.1502 14.6071 17.6737 14.5675 22.0283H17.05L13.513 25.543L9.97889 22.0283H12.5674C12.6071 16.5691 17.0214 12.1503 22.4789 12.1031L22.4789 9.45728Z"
          />
        </g>
      </g>

      <g pointer-events="all">
        <template
          v-for="(handle, index) in computedHandles"
          :key="index"
        >
          <rect
            ref="handlesRef"
            :x="handle.x"
            :y="handle.y"
            :width="handle.width"
            :height="handle.height"
            :aria-label="handle.type"
            class="mce-transform-controls__handle-rect"
            :cursor="transforming ? 'auto' : getCursor(handle.type)"
            @pointerdown="(event: PointerEvent) => start(event, index)"
          />
        </template>
      </g>

      <g
        pointer-events="all"
        class="mce-transform-controls__svg-slot"
      >
        <slot
          name="svg"
          :box="model"
        />
      </g>
    </svg>

    <div v-if="tip" class="mce-transform-controls__tip">
      {{ tip }}
    </div>
  </Component>
</template>

<style lang="scss">
.mce-transform-controls {
  $root: &;

  left: 0;
  top: 0;

  &__svg {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    overflow: visible;
    pointer-events: none;
    color: rgb(var(--mce-theme-primary));
    stroke: currentColor;
  }

  &__diagonal {
    stroke-width: 1px;
    stroke-dasharray: 2px;
    visibility: hidden;
  }

  &__rect {
    stroke-width: 1px;
  }

  &__handle {
    fill: white;
    stroke-width: 1px;
  }

  &__handle-rect {
    stroke-width: 1px;
    fill: transparent;
    stroke: transparent;

    &[aria-label="round-tl"],
    &[aria-label="round-tr"],
    &[aria-label="round-bl"],
    &[aria-label="round-br"] {
      // TODO
    }
  }

  &__rotator {
    fill: white;
    stroke-width: 0.5px;
    stroke: currentColor;
  }

  &__tip {
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translate(-50%, calc(100% + 8px));
    background-color: rgb(var(--mce-theme-primary));
    color: rgb(var(--mce-theme-on-primary));
    font-size: 0.75rem;
    padding: 2px 4px;
    border-radius: 3px;
    text-wrap: nowrap;
  }

  &--dashed {
    #{$root}__rect {
      stroke-dasharray: 4px;
    }
  }

  &--resizing {
    #{$root}__diagonal {
      visibility: visible;
    }
  }

  &--moving {
    #{$root}__handle,
    #{$root}__handle-rect,
    #{$root}__rotator,
    #{$root}__tip {
      visibility: hidden;
    }

    #{$root}__rect {
      opacity: .4;
      stroke-width: 0.5px;
    }

    #{$root}__svg-slot {
      opacity: .4;
      stroke-width: 0.5px;
    }
  }

  &--hide-ui {
    #{$root}__handle,
    #{$root}__handle-rect,
    #{$root}__rect,
    #{$root}__rotator,
    #{$root}__tip {
      visibility: hidden;
    }
  }
}
</style>

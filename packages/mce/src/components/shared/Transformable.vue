<script setup lang="ts">
import type { OrientedBoundingBox } from '../../types'
import { computed, getCurrentInstance, nextTick, onMounted, ref, useModel } from 'vue'

export interface TransformableValue extends OrientedBoundingBox {
  borderRadius: number
}

interface Point {
  x: number
  y: number
}

type Handle
  = | 'move'
    | 'resize-top'
    | 'resize-right'
    | 'resize-bottom'
    | 'resize-left'
    | 'resize-top-left'
    | 'resize-top-right'
    | 'resize-bottom-left'
    | 'resize-bottom-right'
    | 'rotate-top-left'
    | 'rotate-top-right'
    | 'rotate-bottom-left'
    | 'rotate-bottom-right'
    | 'border-radius-top-left'
    | 'border-radius-top-right'
    | 'border-radius-bottom-left'
    | 'border-radius-bottom-right'

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
  resizable?: boolean
  adjustableBorderRadius?: boolean
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
  adjustableBorderRadius: false,
  threshold: 0,
  handleShape: 'rect',
  handles: () => [
    'move',
    // resize
    'resize-left',
    'resize-top',
    'resize-right',
    'resize-bottom',
    'resize-top-left',
    'resize-top-right',
    'resize-bottom-right',
    'resize-bottom-left',
    // border-radius
    'border-radius-top-left',
    'border-radius-top-right',
    'border-radius-bottom-left',
    'border-radius-bottom-right',
    // rotate
    'rotate-top-left',
    'rotate-top-right',
    'rotate-bottom-left',
    'rotate-bottom-right',
  ] as Handle[],
})

const emit = defineEmits<{
  'update:modelValue': [TransformableValue]
  'start': [TransformableValue]
  'move': [TransformableValue, TransformableValue]
  'end': [TransformableValue]
}>()

const cursors: Record<string, any> = {
  'rotate-top-left': (angle: number) => createCursor('rotate', 360 + angle),
  'rotate-top-right': (angle: number) => createCursor('rotate', 90 + angle),
  'rotate-bottom-left': (angle: number) => createCursor('rotate', 270 + angle),
  'rotate-bottom-right': (angle: number) => createCursor('rotate', 180 + angle),
  'resize-left': (angle: number) => createCursor('resizeXy', 180 + angle),
  'resize-top': (angle: number) => createCursor('resizeXy', 90 + angle),
  'resize-right': (angle: number) => createCursor('resizeXy', 180 + angle),
  'resize-bottom': (angle: number) => createCursor('resizeXy', 90 + angle),
  'resize-top-left': (angle: number) => createCursor('resizeBevel', 90 + angle),
  'resize-top-right': (angle: number) => createCursor('resizeBevel', 180 + angle),
  'resize-bottom-right': (angle: number) => createCursor('resizeBevel', 90 + angle),
  'resize-bottom-left': (angle: number) => createCursor('resizeBevel', 180 + angle),
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
  const size = 8
  const { width = 0, height = 0, borderRadius } = model.value
  const center = { x: width / 2, y: height / 2 }
  const shape = props.handleShape
  const lines = [
    { type: 'top', points: [[0, 0], [1, 0]] },
    { type: 'right', points: [[1, 0], [1, 1]] },
    { type: 'bottom', points: [[0, 1], [1, 1]] },
    { type: 'left', points: [[0, 0], [0, 1]] },
  ]
  const points = [
    { type: 'top', point: [0.5, 0] },
    { type: 'right', point: [1, 0.5] },
    { type: 'bottom', point: [0.5, 1] },
    { type: 'left', point: [0, 0.5] },
    { type: 'top-left', point: [0, 0] },
    { type: 'top-right', point: [1, 0] },
    { type: 'bottom-left', point: [0, 1] },
    { type: 'bottom-right', point: [1, 1] },
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
    return {
      type: item.type,
      shape,
      x: item.point[0] * width - size / 2,
      y: item.point[1] * height - size / 2,
      width: size,
      height: size,
    }
  })
  const diagonalPointHandles = pointHandles
    .filter(item => item.type.split('-').length === 2)
  const rotateHandles = diagonalPointHandles
    .map((item) => {
      const sign = {
        x: center.x - item.x > 0 ? 1 : -1,
        y: center.y - item.y > 0 ? 1 : -1,
      }
      return {
        ...item,
        shape: undefined,
        type: `rotate-${item.type}`,
        x: item.x - sign.x * size,
        y: item.y - sign.y * size,
      }
    })
  const minSize = Math.min(width, height)
  const borderRadiusHandles = props.adjustableBorderRadius
    ? diagonalPointHandles
        .map((item) => {
          const sign = {
            x: center.x - item.x > 0 ? 1 : -1,
            y: center.y - item.y > 0 ? 1 : -1,
          }
          const offset = minSize * 0.1
          return {
            ...item,
            shape: 'circle',
            type: `border-radius-${item.type}`,
            x: item.x + sign.x * Math.min(width / 2, offset + borderRadius),
            y: item.y + sign.y * Math.min(height / 2, offset + borderRadius),
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
      // border-radius
      ...borderRadiusHandles,
      // rotate
      ...rotateHandles,
    ]
  }
  else {
    handles = [
      // resize
      ...lineHandles.map(item => ({ ...item, type: `resize-${item.type}` })),
      ...diagonalPointHandles.map(item => ({ ...item, type: `resize-${item.type}` })),
      // border-radius
      ...borderRadiusHandles,
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

  const isMove = handle.type === 'move'
  const isRotate = handle.type.startsWith('rotate')
  const isBorderRadius = handle.type.startsWith('border-radius')
  const isHorizontal = handle.type === 'resize-left' || handle.type === 'resize-right'
  const isHorizontalVertical = handle.type.split('-').length === 2

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

  function onMove(event: MouseEvent): void {
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

        updated.rotate = ((rotate + endAngle - startAngle) + 360) % 360
      }
    }
    else if (isBorderRadius) {
      const offset = rotatePoint(rotatedOffset, { x: 0, y: 0 }, -rotate)
      const _offset = Math.abs(offset.x) < Math.abs(offset.y)
        ? -sign.x * offset.x
        : -sign.y * offset.y * aspectRatio
      updated.borderRadius = Math.min(
        Math.max(0, borderRadius + _offset),
        Math.min(width / 2, height / 2),
      )
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
        const _offset = Math.abs(offset.x) < Math.abs(offset.y)
          ? sign.x * offset.x
          : sign.y * offset.y * aspectRatio
        // TODO
        newRotatedCurrentPoint = rotatePoint(
          {
            x: startPoint.x + sign.x * _offset,
            y: startPoint.y + sign.y * _offset / aspectRatio,
          },
          centerPoint,
          rotate,
        )
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

    const oldValue = { ...model.value }
    const newValue = { ...model.value, ...updated }

    model.value = newValue
    emit('move', newValue, oldValue)
  }

  function onEnd(): void {
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onEnd, true)
    transforming.value = false
    activeHandle.value = undefined
    emit('end', model.value)
  }

  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onEnd, true)

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
  if (type === 'move')
    return 'move'
  const create = cursors[type]
  if (!create) {
    return 'default'
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
</script>

<template>
  <Component
    :is="tag"
    class="mce-transformable"
    :class="[
      transforming && 'mce-transformable--transforming',
      props.hideUi && 'mce-transformable--hide-ui',
      resizeStrategy && `mce-transformable--${resizeStrategy}`,
      activeHandle && `mce-transformable--${activeHandle}`,
      activeHandle === 'move' && 'mce-transformable--moving',
      activeHandle?.startsWith('resize') && 'mce-transformable--resizing',
      activeHandle?.startsWith('rotate') && 'mce-transformable--rotateing',
      props.borderStyle && `mce-transformable--${props.borderStyle}`,
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

    <svg
      class="mce-transformable__svg"
    >
      <rect width="100%" height="100%" fill="none" class="mce-transformable__rect" />

      <rect
        class="mce-transformable__border"
        width="100%"
        height="100%"
        fill="none"
        :rx="model.borderRadius"
        :ry="model.borderRadius"
      />

      <line
        v-if="
          activeHandle === 'resize-top'
            || activeHandle === 'resize-right'
            || activeHandle === 'resize-top-right'
            || activeHandle === 'resize-bottom-left'
        "
        class="mce-transformable__diagonal" x1="100%" y1="0" x2="0" y2="100%"
      />

      <line
        v-else-if="
          activeHandle === 'resize-left'
            || activeHandle === 'resize-bottom'
            || activeHandle === 'resize-top-left'
            || activeHandle === 'resize-bottom-right'
        "
        class="mce-transformable__diagonal" x1="0" y1="0" x2="100%" y2="100%"
      />

      <g>
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
              class="mce-transformable__handle"
            />

            <circle
              v-else
              :cx="handle.x + handle.width / 2"
              :cy="handle.y + handle.width / 2"
              :r="handle.width / 2"
              :aria-label="handle.type"
              class="mce-transformable__handle"
            />
          </template>
        </template>
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
            class="mce-transformable__handle-rect"
            :cursor="transforming ? 'auto' : getCursor(handle.type)"
            @pointerdown="(event: PointerEvent) => start(event, index)"
          />
        </template>
      </g>

      <g
        pointer-events="all"
        class="mce-transformable__svg-slot"
      >
        <slot
          name="svg"
          :box="model"
        />
      </g>
    </svg>

    <div v-if="tip" class="mce-transformable__tip">
      {{ tip }}
    </div>
  </Component>
</template>

<style lang="scss">
.mce-transformable {
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

  &__rect,
  &__border {
    stroke-width: 1px;
  }

  &__handle {
    fill: white;
    stroke-width: 1px;
    pointer-events: none;
  }

  &__handle-rect {
    stroke-width: 1px;
    fill: transparent;
    stroke: transparent;
  }

  &__tip {
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translate(-50%, calc(100% + 8px));
    background-color: rgb(var(--mce-theme-primary));
    color: rgb(var(--mce-theme-on-primary));
    font-size: 12px;
    padding: 2px 4px;
    border-radius: 3px;
    text-wrap: nowrap;
  }

  &--dashed {
    #{$root}__rect {
      stroke-dasharray: 4px;
    }
  }

  &--lockAspectRatio,
  &--lockAspectRatioDiagonal {
    &#{$root}--resizing {
      #{$root}__diagonal {
        visibility: visible;
      }
    }
  }

  &--moving {
    #{$root}__handle {
      visibility: hidden;
    }

    #{$root}__handle-rect {
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
    #{$root}__handle {
      visibility: hidden;
    }

    #{$root}__handle-rect {
      visibility: hidden;
    }

    #{$root}__rect {
      visibility: hidden;
    }
  }
}
</style>

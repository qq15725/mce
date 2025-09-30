<script setup lang="ts">
import type { OrientedBoundingBox } from '../../types'
import { computed, getCurrentInstance, nextTick, onMounted, ref, useModel } from 'vue'
import Tooltip from './Tooltip.vue'

interface Point {
  x: number
  y: number
}

type Handle
  = | 'move'
    | 'rotate-top-left'
    | 'rotate-top-right'
    | 'rotate-bottom-left'
    | 'rotate-bottom-right'
    | 'resize-top'
    | 'resize-right'
    | 'resize-bottom'
    | 'resize-left'
    | 'resize-top-left'
    | 'resize-top-right'
    | 'resize-bottom-left'
    | 'resize-bottom-right'

interface HandleObject {
  type: Handle
  x: number
  y: number
  width: number
  height: number
}

const props = withDefaults(defineProps<{
  tag?: string | any
  modelValue?: Partial<OrientedBoundingBox>
  moveable?: boolean
  rotatable?: boolean
  resizable?: boolean
  threshold?: number
  resizeStrategy?: 'free' | 'aspectRatio' | 'diagonalAspectRatio'
  handleStrategy?: 'default' | 'point'
  handleShape?: 'rect' | 'circle'
  color?: string
  handleColor?: string
  visibility?: 'visible' | 'none' | 'auto'
  handles?: Handle[]
  initialSize?: boolean
  borderStyle?: 'solid' | 'dashed'
  getTipText?: (type: 'rotate' | 'resize') => string
}>(), {
  tag: 'div',
  moveable: true,
  rotatable: true,
  resizable: true,
  threshold: 0,
  resizeStrategy: 'free',
  handleStrategy: 'default',
  color: 'black',
  handleColor: 'white',
  visibility: 'auto',
  handles: () => [
    'move',
    'rotate-top-left',
    'rotate-top-right',
    'rotate-bottom-left',
    'rotate-bottom-right',
    'resize-left',
    'resize-top',
    'resize-right',
    'resize-bottom',
    'resize-top-left',
    'resize-top-right',
    'resize-bottom-right',
    'resize-bottom-left',
  ] as Handle[],
})

const emit = defineEmits<{
  'update:modelValue': [OrientedBoundingBox]
  'start': [OrientedBoundingBox]
  'move': [OrientedBoundingBox, OrientedBoundingBox]
  'end': [OrientedBoundingBox]
}>()

const cursors: Record<Exclude<Handle, 'move'>, any> = {
  'rotate-top-left': (rotation: number) => createCursor('rotate', 360 + rotation),
  'rotate-top-right': (rotation: number) => createCursor('rotate', 90 + rotation),
  'rotate-bottom-left': (rotation: number) => createCursor('rotate', 270 + rotation),
  'rotate-bottom-right': (rotation: number) => createCursor('rotate', 180 + rotation),
  'resize-left': (rotation: number) => createCursor('resizeXy', 180 + rotation),
  'resize-top': (rotation: number) => createCursor('resizeXy', 90 + rotation),
  'resize-right': (rotation: number) => createCursor('resizeXy', 180 + rotation),
  'resize-bottom': (rotation: number) => createCursor('resizeXy', 90 + rotation),
  'resize-top-left': (rotation: number) => createCursor('resizeBevel', 90 + rotation),
  'resize-top-right': (rotation: number) => createCursor('resizeBevel', 180 + rotation),
  'resize-bottom-right': (rotation: number) => createCursor('resizeBevel', 90 + rotation),
  'resize-bottom-left': (rotation: number) => createCursor('resizeBevel', 180 + rotation),
}

const modelValue = useModel(props, 'modelValue')
const model = computed({
  get: () => {
    let { left = 0, top = 0, width = 0, height = 0, rotate = 0 } = modelValue.value ?? {}
    if (Number.isNaN(Number(width)))
      width = 0
    if (Number.isNaN(Number(height)))
      height = 0
    return { left, top, width, height, rotate }
  },
  set: val => modelValue.value = val,
})
const transforming = ref(false)
const activeHandle = ref<Handle>()
const computedHandles = computed<HandleObject[]>(() => {
  const { width = 0, height = 0 } = model.value
  const size = 6
  const sizeHalf = size / 2
  const size1 = 9
  const size1Half = size1 / 2
  const size2 = 12
  let handles
  if (props.handleStrategy === 'point') {
    handles = [
      // move
      { type: 'move', x: -sizeHalf, y: size1Half, width: size, height: height - size1 },
      { type: 'move', x: size1Half, y: -sizeHalf, width: width - size1, height: size },
      { type: 'move', x: width - sizeHalf, y: size1Half, width: size, height: height - size1 },
      { type: 'move', x: size1Half, y: height - sizeHalf, width: width - size1, height: size },
      { type: 'move', x: -sizeHalf, y: size1Half, width: size, height: height - size1 },
      // resize
      { type: 'resize-top', x: width / 2 - size1Half, y: -size1Half, width: size1, height: size1 },
      { type: 'resize-right', x: width - size1Half, y: height / 2 - size1Half, width: size1, height: size1 },
      { type: 'resize-bottom', x: width / 2 - size1Half, y: height + -size1Half, width: size1, height: size1 },
      { type: 'resize-left', x: -size1Half, y: height / 2 - size1Half, width: size1, height: size1 },
      { type: 'resize-top-left', x: -size1Half, y: -size1Half, width: size1, height: size1 },
      { type: 'resize-top-right', x: width - size1Half, y: -size1Half, width: size1, height: size1 },
      { type: 'resize-bottom-left', x: -size1Half, y: height - size1Half, width: size1, height: size1 },
      { type: 'resize-bottom-right', x: width - size1Half, y: height - size1Half, width: size1, height: size1 },
      // rotate
      { type: 'rotate-top-left', x: -size2 - size1Half, y: -size2 - size1Half, width: size2, height: size2 },
      { type: 'rotate-top-right', x: width + size1Half, y: -size2 - size1Half, width: size2, height: size2 },
      { type: 'rotate-bottom-left', x: -size2 - size1Half, y: height + size1Half, width: size2, height: size2 },
      { type: 'rotate-bottom-right', x: width + size1Half, y: height + size1Half, width: size2, height: size2 },
    ]
  }
  else {
    handles = [
      // resize
      { type: 'resize-top', x: size1Half, y: -sizeHalf, width: width - size1, height: size },
      { type: 'resize-right', x: width - sizeHalf, y: size1Half, width: size, height: height - size1 },
      { type: 'resize-bottom', x: size1Half, y: height - sizeHalf, width: width - size1, height: size },
      { type: 'resize-left', x: -sizeHalf, y: size1Half, width: size, height: height - size1 },
      { type: 'resize-top-left', x: -size1Half, y: -size1Half, width: size1, height: size1 },
      { type: 'resize-top-right', x: width - size1Half, y: -size1Half, width: size1, height: size1 },
      { type: 'resize-bottom-left', x: -size1Half, y: height - size1Half, width: size1, height: size1 },
      { type: 'resize-bottom-right', x: width - size1Half, y: height - size1Half, width: size1, height: size1 },
      // rotate
      { type: 'rotate-top-left', x: -size2 - size1Half, y: -size2 - size1Half, width: size2, height: size2 },
      { type: 'rotate-top-right', x: width + size1Half, y: -size2 - size1Half, width: size2, height: size2 },
      { type: 'rotate-bottom-left', x: -size2 - size1Half, y: height + size1Half, width: size2, height: size2 },
      { type: 'rotate-bottom-right', x: width + size1Half, y: height + size1Half, width: size2, height: size2 },
    ]
  }
  return handles.filter(val => props.handles.includes(val.type as Handle))
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
const tipTarget = ref<any>()
const tipText = ref<string>()
const isAutoVisibilityTransforming = computed(() => props.visibility === 'auto' && transforming.value)

function start(event?: MouseEvent, index?: number): boolean {
  if (event && event.button !== undefined && event.button !== 0) {
    return false
  }

  event?.preventDefault()
  event?.stopPropagation()

  const { left = 0, top = 0, width = 0, height = 0, rotate = 0 } = model.value

  const aspectRatio = width && height ? width / height : 0

  const anchor = index === undefined
    ? { type: 'move', x: 0, y: 0, width: 0, height: 0 } as HandleObject
    : computedHandles.value[index]

  activeHandle.value = anchor.type

  const isMove = anchor.type === 'move'
  const isRotate = anchor.type.startsWith('rotate')
  const isHorizontal = anchor.type === 'resize-left' || anchor.type === 'resize-right'
  const isHorizontalVertical = anchor.type.split('-').length === 2

  const centerPoint = {
    x: left + width / 2,
    y: top + height / 2,
  }

  const startingPointBefore = {
    x: left,
    y: top,
  }

  if (!isMove) {
    startingPointBefore.x += anchor.x + anchor.width / 2
    startingPointBefore.y += anchor.y + anchor.height / 2
  }

  const startingPoint = calcRotation(
    startingPointBefore,
    centerPoint,
    isMove ? 0 : rotate,
  )

  const symmetricPoint = {
    x: centerPoint.x * 2 - startingPoint.x,
    y: centerPoint.y * 2 - startingPoint.y,
  }

  const rotationBefore = Math.atan2(
    startingPoint.y - centerPoint.y,
    startingPoint.x - centerPoint.x,
  ) / (Math.PI / 180)

  let client: { x: number, y: number } | undefined = event
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
    const updated = {} as Required<OrientedBoundingBox>

    if (!client) {
      client = { x: event.clientX, y: event.clientY }
    }

    const clientOffset = {
      x: event.clientX - client.x,
      y: event.clientY - client.y,
    }

    if (!transforming.value) {
      if (
        Math.abs(clientOffset.x) < props.threshold
        && Math.abs(clientOffset.y) < props.threshold
      ) {
        return
      }

      startTransform()
    }

    const cursorPoint = {
      x: startingPoint.x + clientOffset.x,
      y: startingPoint.y + clientOffset.y,
    }

    if (isMove) {
      if (!props.moveable) {
        return
      }
      updated.left = cursorPoint.x
      updated.top = cursorPoint.y
    }
    else if (isRotate) {
      const rotationAfter = Math.atan2(
        cursorPoint.y - centerPoint.y,
        cursorPoint.x - centerPoint.x,
      ) / (Math.PI / 180)

      updated.rotate = ((rotate + rotationAfter - rotationBefore) + 360) % 360
    }
    else if (isHorizontalVertical) {
      const rotationBefore = calcRotation(cursorPoint, startingPoint, -rotate)
      const rotationAfter = calcRotation(
        isHorizontal
          ? { x: rotationBefore.x, y: startingPoint.y }
          : { x: startingPoint.x, y: rotationBefore.y },
        startingPoint,
        rotate,
      )

      const newCenterPoint = {
        x: rotationAfter.x - (rotationAfter.x - symmetricPoint.x) / 2,
        y: rotationAfter.y + (symmetricPoint.y - rotationAfter.y) / 2,
      }

      const hypotenuse = calcHypotenuse(rotationAfter, symmetricPoint)

      if (isHorizontal) {
        updated.width = hypotenuse
        if (aspectRatio && props.resizeStrategy === 'aspectRatio') {
          updated.height = hypotenuse / aspectRatio
        }
      }
      else {
        updated.height = hypotenuse
        if (aspectRatio && props.resizeStrategy === 'aspectRatio') {
          updated.width = hypotenuse * aspectRatio
        }
      }

      updated.left = newCenterPoint.x - ((isHorizontal ? hypotenuse : width) / 2)
      updated.top = newCenterPoint.y - ((isHorizontal ? height : hypotenuse) / 2)
    }
    else {
      if (
        aspectRatio
        && (
          props.resizeStrategy === 'aspectRatio'
          || props.resizeStrategy === 'diagonalAspectRatio'
        )
      ) {
        let flag = 1
        switch (anchor.type) {
          case 'resize-top-right':
          case 'resize-bottom-left':
            flag = -1
            break
        }
        if (clientOffset.x > clientOffset.y) {
          cursorPoint.x = startingPoint.x + clientOffset.x
          cursorPoint.y = startingPoint.y + flag * clientOffset.x / aspectRatio
        }
        else {
          cursorPoint.x = startingPoint.x + flag * clientOffset.y * aspectRatio
          cursorPoint.y = startingPoint.y + clientOffset.y
        }
      }

      const newCenterPoint = calcCenter(cursorPoint, symmetricPoint)

      const points = [
        calcRotation(cursorPoint, newCenterPoint, -rotate),
        calcRotation(symmetricPoint, newCenterPoint, -rotate),
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

    if (!isMove) {
      tipTarget.value = handlesRef.value?.[index!]
      if (isRotate) {
        tipText.value = props.getTipText?.('rotate') ?? `${Math.floor(newValue.rotate)}°`
      }
      else {
        tipText.value = props.getTipText?.('resize') ?? `${Math.floor(newValue.width)} x ${Math.floor(newValue.height)}`
      }
    }
  }

  function onEnd(): void {
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onEnd, true)
    tipTarget.value = undefined
    tipText.value = undefined
    transforming.value = false
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

function createCursor(type: 'rotate' | 'resizeXy' | 'resizeBevel', rotation: number) {
  const path = cursorMap[type]
  return `<svg height="32" width="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><defs><filter id="shadow" color-interpolation-filters="sRGB"><feDropShadow dx="1" dy="1" stdDeviation="1.2" flood-opacity=".5"/></filter></defs><g fill="none" transform="rotate(${rotation} 16 16)" filter="url(%23shadow)">${path}</g></svg>`
    .replace(/"/g, '\'')
}

function getCursor(type: Handle) {
  if (type === 'move')
    return 'move'
  return `url("data:image/svg+xml,${cursors[type](model.value.rotate ?? 0)}") 16 16, pointer`
}

function calcRotation(point: Point, origin: Point, angle: number): Point {
  const radian = angle * Math.PI / 180
  const cos = Math.cos(radian)
  const sin = Math.sin(radian)
  return {
    x: (point.x - origin.x) * cos
      - (point.y - origin.y) * sin
      + origin.x,
    y: (point.x - origin.x) * sin
      + (point.y - origin.y) * cos
      + origin.y,
  }
}

function calcCenter(point1: Point, point2: Point) {
  return {
    x: (point2.x + point1.x) / 2,
    y: (point2.y + point1.y) / 2,
  }
}

function calcHypotenuse(point1: Point, point2: Point) {
  return Math.sqrt((point1.x - point2.x) ** 2 + (point1.y - point2.y) ** 2)
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
    :style="style"
  >
    <slot
      :value="modelValue"
      :move-props="{
        onPointerdown: start,
        style: { cursor: 'move' },
      }"
      :start="start"
    />

    <svg class="mce-transformable__svg">
      <rect
        width="100%"
        height="100%"
        fill="none"
        class="mce-transformable__box"
        :style="{
          strokeDasharray: props.borderStyle === 'dashed' ? '4px' : undefined,
          opacity: visibility === 'none' ? 0 : isAutoVisibilityTransforming ? '.4' : undefined,
          strokeWidth: isAutoVisibilityTransforming ? '0.5px' : undefined,
        }"
      />

      <g pointer-events="all">
        <template
          v-for="(handle, index) in computedHandles.filter(v => {
            return !(
              (!resizable && v.type.startsWith('resize'))
              || (!rotatable && v.type.startsWith('rotate'))
              || (!moveable && v.type === 'move')
            )
          })"
          :key="index"
        >
          <template
            v-if="handleStrategy === 'point'
              ? handle.type.startsWith('resize')
              : (handle.type === 'resize-top-left'
                || handle.type === 'resize-top-right'
                || handle.type === 'resize-bottom-left'
                || handle.type === 'resize-bottom-right')"
          >
            <template v-if="props.handleShape === 'rect'">
              <rect
                :x="handle.x"
                :y="handle.y"
                :width="handle.width"
                :height="handle.height"
                :aria-label="handle.type"
                :fill="handleColor"
                class="mce-transformable__handle"
                :style="{
                  opacity: (
                    visibility === 'none'
                    || (transforming && visibility !== 'visible')
                  ) ? 0 : undefined,
                }"
              />
            </template>

            <template v-else>
              <circle
                :cx="handle.x + handle.width / 2"
                :cy="handle.y + handle.width / 2"
                :r="handle.width / 2"
                :aria-label="handle.type"
                :fill="handleColor"
                class="mce-transformable__handle"
                :style="{
                  opacity: (
                    visibility === 'none'
                    || (transforming && visibility !== 'visible')
                  ) ? 0 : undefined,
                }"
              />
            </template>
          </template>

          <rect
            ref="handlesRef"
            :x="handle.x"
            :y="handle.y"
            :width="handle.width"
            :height="handle.height"
            :aria-label="handle.type"
            class="mce-transformable__handle-box"
            :style="{
              opacity: (
                visibility === 'none'
                || (transforming && visibility !== 'visible')
              ) ? 0 : undefined,
            }"
            :cursor="transforming ? 'auto' : getCursor(handle.type)"
            @pointerdown="(event: PointerEvent) => start(event, index)"
          />
        </template>
      </g>

      <g
        pointer-events="all"
        :style="isAutoVisibilityTransforming
          ? { opacity: '.4', strokeWidth: '0.5px' }
          : undefined"
      >
        <slot
          name="svg"
          :box="model"
        />
      </g>
    </svg>

    <Tooltip
      v-if="tipTarget && tipText"
      model-value
      :target="tipTarget"
    >
      <div style="font-size: 12px; text-wrap: nowrap">
        {{ tipText }}
      </div>
    </Tooltip>
  </Component>
</template>

<style lang="scss">
.mce-transformable {
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
  }

  &__box {
    stroke: currentColor;
    stroke-width: 2px;
  }

  &__handle {
    stroke: currentColor;
    stroke-width: 2px;
    pointer-events: none;
  }

  &__handle-box {
    stroke-width: 2px;
    fill: transparent;
    stroke: transparent;
  }
}
</style>

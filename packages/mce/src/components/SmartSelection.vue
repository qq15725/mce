<script setup lang="ts">
import type { Aabb2D, Element2D } from 'modern-canvas'
import type { TransformValue } from './shared/Transform.vue'
import { computed, ref, watch } from 'vue'
import { useEditor } from '../composables'
import { addDragListener } from '../utils'
import Transform from './shared/Transform.vue'

const currentElement = defineModel<Element2D>()

const {
  isPointerInSelection,
  elementSelection,
  getObb,
  state,
  camera,
  resizeElement,
  inEditorIs,
  aabbToDrawboardAabb,
} = useEditor()

const info = ref<{
  direction: 'horizontal' | 'vertical'
  spacing: number
  items: Element2D[]
}>()

const disableUpdate = ref(false)
const dragState = ref<'spacing' | 'ring'>()

function _update(): void {
  if (disableUpdate.value) {
    return
  }

  const _selection = elementSelection.value

  let direction: 'vertical' | 'horizontal' = 'vertical'
  let spacing: number | undefined
  let items: Element2D[] = []

  if (_selection.length > 1) {
    let prev

    const sorted = [..._selection].sort((a, b) => a.globalAabb.y - b.globalAabb.y)
    for (let i = 0; i < sorted.length; i++) {
      const cur = sorted[i]
      if (prev) {
        if (!cur.globalAabb.overlap(prev.globalAabb, 'x')) {
          spacing = undefined
          break
        }
        const _spacing = cur.globalAabb.top - prev.globalAabb.bottom
        if (spacing !== undefined && Math.abs(spacing - _spacing) >= 1) {
          spacing = undefined
          break
        }
        spacing = _spacing
      }
      prev = cur
    }

    if (spacing !== undefined) {
      items = sorted
      direction = 'vertical'
    }
    else {
      prev = undefined
      const sorted = [..._selection].sort((a, b) => a.globalAabb.x - b.globalAabb.x)
      for (let i = 0; i < sorted.length; i++) {
        const cur = sorted[i]
        if (prev) {
          if (!cur.globalAabb.overlap(prev.globalAabb, 'y')) {
            spacing = undefined
            break
          }
          const _spacing = cur.globalAabb.left - prev.globalAabb.right
          if (spacing !== undefined && Math.abs(spacing - _spacing) >= 1) {
            spacing = undefined
            break
          }
          spacing = _spacing
        }
        prev = cur
      }
      if (spacing !== undefined) {
        items = sorted
        direction = 'horizontal'
      }
    }
  }

  if (spacing !== undefined) {
    info.value = {
      direction,
      spacing,
      items,
    }
  }
  else {
    info.value = undefined
  }
}

watch(() => {
  return elementSelection.value.map((el) => {
    return {
      left: el.style.left,
      top: el.style.top,
      width: el.style.width,
      height: el.style.height,
      rotate: el.style.rotate,
    }
  })
}, _update)

watch(
  () => elementSelection.value.map(el => el.instanceId),
  () => currentElement.value = undefined,
)

const boxes = computed(() => {
  return elementSelection.value.map((el) => {
    return {
      el,
      style: getObb(el, 'drawboard').toCssStyle(),
    }
  })
})

const spacingHandles = computed(() => {
  const handles: { el: Element2D, style: Record<string, any> }[] = []

  if (!info.value) {
    return handles
  }

  const { direction, spacing = 0, items } = info.value
  const { zoom, position } = camera.value

  const toScreen = (pos: { x: number, y: number }) => {
    pos.x *= zoom.x
    pos.y *= zoom.y
    pos.x -= position.x
    pos.y -= position.y
  }

  for (let i = 0; i < items.length; i++) {
    const cur = items[i]
    const next = items[i + 1]

    if (!next) {
      break
    }

    const axis = direction === 'horizontal' ? 'y' : 'x'
    const min = Math.max(cur.globalAabb.min[axis], next.globalAabb.min[axis])
    const max = Math.min(cur.globalAabb.max[axis], next.globalAabb.max[axis])
    let pos
    let size
    switch (direction) {
      case 'horizontal':
        pos = {
          x: cur.globalAabb.x + cur.globalAabb.width,
          y: min,
        }
        size = {
          x: spacing,
          y: max - min,
        }
        break
      case 'vertical':
        pos = {
          x: min,
          y: cur.globalAabb.y + cur.globalAabb.height,
        }
        size = {
          x: max - min,
          y: spacing,
        }
        break
    }
    toScreen(pos)
    size.x *= zoom.x
    size.y *= zoom.y
    handles.push({
      el: cur,
      style: {
        width: `${size.x}px`,
        height: `${size.y}px`,
        transform: `matrix(1, 0, 0, 1, ${pos.x}, ${pos.y})`,
      },
    })
  }

  return handles
})

const currentTransform = computed({
  get: () => {
    const { left, top, width, height, rotationDegrees: rotate } = getObb(currentElement.value)
    return { left, top, width, height, rotate }
  },
  set: (val: TransformValue) => {
    const oldTransform = currentTransform.value
    const offsetStyle = {
      left: val.left - oldTransform.left,
      top: val.top - oldTransform.top,
      width: val.width - oldTransform.width,
      height: val.height - oldTransform.height,
      rotate: val.rotate - oldTransform.rotate,
    }

    const el = currentElement.value!
    const style = el.style
    const newStyle = {
      left: style.left + offsetStyle.left,
      top: style.top + offsetStyle.top,
      width: style.width + offsetStyle.width,
      height: style.height + offsetStyle.height,
      rotate: (style.rotate + offsetStyle.rotate + 360) % 360,
    }
    const { left, top, right, bottom } = el.globalAabb
    const shape = el.shape
    resizeElement(
      el,
      newStyle.width,
      newStyle.height,
      inEditorIs(el, 'Frame')
        ? undefined
        : shape.isValid()
          ? { deep: true }
          : { deep: true, textToFit: true },
    )
    newStyle.width = el.style.width
    newStyle.height = el.style.height
    Object.assign(el.style, newStyle)
    el.updateGlobalTransform()
    const aabb = el.globalAabb
    const offset = {
      left: aabb.left - left,
      top: aabb.top - top,
      right: aabb.right - right,
      bottom: aabb.bottom - bottom,
    }

    const _info = info.value
    if (!_info) {
      return
    }
    const { direction, items } = _info
    let after = false
    switch (direction) {
      case 'horizontal':
        items.forEach((item) => {
          // TODO 旋转
          if (item.equal(el)) {
            after = true
          }
          else if (after) {
            item.style.left += offset.right
          }
          else {
            item.style.left += offset.left
          }
        })
        break
      case 'vertical':
        items.forEach((item) => {
          // TODO 旋转
          if (item.equal(el)) {
            after = true
          }
          else if (after) {
            item.style.top += offset.bottom
          }
          else {
            item.style.top += offset.top
          }
        })
        break
    }
  },
})

const globalAabb = ref<Aabb2D>()
const _globalAabb = computed(() => {
  return globalAabb.value ? aabbToDrawboardAabb(globalAabb.value as any) : undefined
})

function onRingDrag(event: PointerEvent, item: any) {
  const el = item.el as Element2D
  currentElement.value = el

  const _info = info.value
  if (!_info) {
    return
  }

  const { direction } = _info
  globalAabb.value = el.globalAabb.clone()
  const elAabb = globalAabb.value

  let sorted: Element2D[] = []
  let min = Number.MIN_SAFE_INTEGER
  let max = Number.MAX_SAFE_INTEGER
  let prev: Element2D | undefined
  let next: Element2D | undefined

  function update() {
    const key = direction === 'horizontal' ? 'x' : 'y'
    sorted = [...elementSelection.value].sort((a, b) => {
      if (a.equal(el))
        return elAabb[key] - b.globalAabb[key]
      if (b.equal(el))
        return a.globalAabb[key] - elAabb[key]
      return a.globalAabb[key] - b.globalAabb[key]
    })
    const index = sorted.findIndex(v => v.equal(el))
    prev = sorted[index - 1]
    next = sorted[index + 1]
    if (direction === 'horizontal') {
      if (prev) {
        min = prev.globalAabb.left + elAabb.width
      }
      if (next) {
        max = next.globalAabb.right - elAabb.width
      }
    }
    else {
      if (prev) {
        min = prev.globalAabb.top + elAabb.height
      }
      if (next) {
        max = next.globalAabb.bottom - elAabb.height
      }
    }
  }

  update()

  addDragListener(event, {
    threshold: 3,
    start: () => {
      disableUpdate.value = true
      state.value = 'moving'
      dragState.value = 'ring'
    },
    move: ({ movePoint, currentPoint }) => {
      const offset = {
        x: movePoint.x - currentPoint.x,
        y: movePoint.y - currentPoint.y,
      }
      const { zoom } = camera.value
      el.position.set(
        el.position.x + offset.x / zoom.x,
        el.position.y + offset.y / zoom.y,
      )
      const center = el.globalAabb.getCenter()
      switch (direction) {
        case 'horizontal': {
          if (center.x < min) {
            if (next) {
              // TODO 旋转
              const left = next.globalAabb.right - elAabb.width
              let _left = elAabb.left
              const parentAabb = next.getParent<Element2D>()?.globalAabb
              if (parentAabb) {
                _left -= parentAabb.x
              }
              next.style.left = _left
              elAabb.x = left
              next.updateGlobalTransform()
              update()
            }
          }
          else if (center.x > max) {
            if (prev) {
              // TODO 旋转
              let left = elAabb.right - prev.globalAabb.width
              elAabb.x = prev.globalAabb.left
              const parentAabb = prev.getParent<Element2D>()?.globalAabb
              if (parentAabb) {
                left -= parentAabb.x
              }
              prev.style.left = left
              prev.updateGlobalTransform()
              update()
            }
          }
          break
        }
        case 'vertical': {
          if (center.y < min) {
            if (prev) {
              // TODO 旋转
              let top = elAabb.bottom - prev.globalAabb.height
              elAabb.y = prev.globalAabb.top
              const parentAabb = prev.getParent<Element2D>()?.globalAabb
              if (parentAabb) {
                top -= parentAabb.y
              }
              prev.style.top = top
              prev.updateGlobalTransform()
              update()
            }
          }
          else if (center.y > max) {
            if (next) {
              // TODO 旋转
              const top = next.globalAabb.bottom - elAabb.height
              let _top = elAabb.top
              const parentAabb = next.getParent<Element2D>()?.globalAabb
              if (parentAabb) {
                _top -= parentAabb.y
              }
              next.style.top = _top
              elAabb.y = top
              next.updateGlobalTransform()
              update()
            }
          }
          break
        }
      }
    },
    end: () => {
      // TODO 旋转
      let x = elAabb.x
      let y = elAabb.y
      const parentAabb = el.getParent<Element2D>()?.globalAabb
      if (parentAabb) {
        x -= parentAabb.x
        y -= parentAabb.y
      }
      el.style.left = x
      el.style.top = y
      el.position.x = x
      el.position.y = y
      el.updateGlobalTransform()
      globalAabb.value = undefined
      state.value = undefined
      dragState.value = undefined
      disableUpdate.value = false
      _update()
    },
  })
}

function onSpacingDrag(event: PointerEvent) {
  const _info = info.value

  if (!_info) {
    return
  }

  const { direction, items } = _info

  addDragListener(event, {
    threshold: 3,
    start: () => {
      state.value = 'moving'
      dragState.value = 'spacing'
    },
    move: ({ movePoint, currentPoint }) => {
      const offset = {
        x: movePoint.x - currentPoint.x,
        y: movePoint.y - currentPoint.y,
      }

      const { zoom } = camera.value
      offset.x /= zoom.x
      offset.y /= zoom.y

      switch (direction) {
        case 'horizontal':
          items.forEach((item, index) => {
            // TODO 旋转
            item.style.left += index * offset.x
          })
          break
        case 'vertical':
          items.forEach((item, index) => {
            // TODO 旋转
            item.style.top += index * offset.y
          })
          break
      }
    },
    end: () => {
      state.value = undefined
      dragState.value = undefined
    },
  })
}
</script>

<template>
  <div
    v-if="info"
    class="mce-smart-selection"
    :class="{
      'mce-smart-selection--hover': !state && isPointerInSelection,
      [`mce-smart-selection--${info.direction}`]: true,
      [`mce-smart-selection--${dragState}`]: dragState !== undefined,
    }"
  >
    <template
      v-if="state !== 'moving'"
    >
      <div
        v-for="(item, index) in boxes"
        :key="index"
        class="mce-smart-selection__node"
        :class="{
          'mce-smart-selection__node--active': item.el.equal(currentElement),
        }"
        :style="item.style"
      >
        <div
          class="mce-smart-selection__ring"
          @pointerdown="onRingDrag($event, item)"
        />
      </div>

      <Transform
        v-if="currentTransform.width && currentTransform.height"
        v-model="currentTransform"
        :handles="['resize-l', 'resize-r', 'resize-t', 'resize-b']"
        class="mce-smart-selection__transform"
        color="#FF24BD"
        :scale="[camera.zoom.x, camera.zoom.y]"
        :offset="[-camera.position.x, -camera.position.y]"
      />
    </template>

    <div
      v-for="(item, index) in spacingHandles"
      :key="index"
      class="mce-smart-selection__spacing"
      :style="item.style"
    >
      <div
        class="mce-smart-selection__spacing-line"
        @pointerdown="onSpacingDrag($event)"
      />
    </div>

    <div
      v-if="_globalAabb"
      class="mce-smart-selection__ghost"
      :style="_globalAabb.toCssStyle()"
    />
  </div>
</template>

<style lang="scss">
  .mce-smart-selection {
    $root: &;
    position: absolute;
    overflow: hidden;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;

    &__node {
      position: absolute;
      display: flex;
      align-items: center;
      justify-content: center;

      &--active #{$root}__ring {
        background: #FF24BD;
      }
    }

    &__ghost {
      position: absolute;
      border: 1px solid rgb(var(--mce-theme-primary));
    }

    &__ring {
      width: 1px;
      height: 1px;
      border-radius: 100%;
      border: 1px solid #FF24BD;
      outline: 1px solid #FFFFFF;
      pointer-events: auto;

      &:hover {
        background: #FF24BD;
      }
    }

    &__spacing {
      position: absolute;
      left: 0;
      top: 0;
      visibility: hidden;
      display: flex;
      align-items: center;
      justify-content: center;

      &-line {
        height: 10px;
        width: 10px;
        pointer-events: auto;
        display: flex;
        align-items: center;
        justify-content: center;

        &:before {
          content: '';
          display: block;
          width: 100%;
          height: 100%;
          background-color: #FF24BD;
        }
      }
    }

    &--hover {
      #{$root}__ring {
        width: 10px;
        height: 10px;
      }

      #{$root}__spacing {
        visibility: visible;
      }
    }

    &--vertical {
      #{$root}__spacing-line {
        height: 4px;
        cursor: row-resize;
      }

      #{$root}__spacing-line:before {
        height: 1px;
      }
    }

    &--horizontal {
      #{$root}__spacing-line {
        width: 4px;
        cursor: col-resize;
      }

      #{$root}__spacing-line:before {
        width: 1px;
      }
    }

    &--ring {
      #{$root}__spacing {
        visibility: hidden;
      }
    }

    &--spacing {
      #{$root}__spacing {
        visibility: visible;
        background-color: #FF24BD;
        opacity: .3;
      }

      #{$root}__spacing-line {
        visibility: hidden;
      }
    }
  }
</style>

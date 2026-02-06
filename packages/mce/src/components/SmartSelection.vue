<script setup lang="ts">
import type { Aabb2D, Element2D } from 'modern-canvas'
import type { TransformValue } from './shared/TransformControls.vue'
import { computed, ref, watch } from 'vue'
import { useEditor } from '../composables'
import { handleDrag } from '../utils'
import TransformControls from './shared/TransformControls.vue'

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

watch(() => {
  return elementSelection.value.map(el => el.instanceId)
}, () => currentElement.value = undefined)

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
    switch (direction) {
      case 'horizontal':
        pos = {
          x: cur.globalAabb.x + cur.globalAabb.width + spacing / 2,
          y: min + (max - min) / 2,
        }
        break
      case 'vertical':
        pos = {
          x: min + (max - min) / 2,
          y: cur.globalAabb.y + cur.globalAabb.height + spacing / 2,
        }
        break
    }
    toScreen(pos)
    pos[axis] -= 2
    handles.push({
      el: cur,
      style: {
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

function onRingMouseDown(event: MouseEvent, item: any) {
  const el = item.el as Element2D
  currentElement.value = el

  const _info = info.value
  if (!_info) {
    return
  }

  const { direction, spacing } = _info
  globalAabb.value = el.globalAabb.clone()
  const elAabb = globalAabb.value

  handleDrag(event, {
    start: () => {
      disableUpdate.value = true
      state.value = 'moving'
    },
    move: (offset) => {
      const { zoom } = camera.value
      el.position.set(
        el.position.x + offset.x / zoom.x,
        el.position.y + offset.y / zoom.y,
      )
      const fixedCenter = elAabb.getCenter()
      const center = el.globalAabb.getCenter()
      switch (direction) {
        case 'horizontal': {
          const diff = center.x - fixedCenter.x
          const absDiff = Math.abs(diff)
          if (absDiff > spacing + elAabb.height / 2) {
            const sorted = [...elementSelection.value].sort((a, b) => {
              if (a.equal(el))
                return elAabb.x - b.globalAabb.x
              if (b.equal(el))
                return a.globalAabb.x - elAabb.x
              return a.globalAabb.x - b.globalAabb.x
            })
            const index = sorted.findIndex(v => v.equal(el))
            if (diff > 0) {
              const target = sorted[index + 1]
              if (target) {
                // TODO 旋转
                const left = target.globalAabb.right - elAabb.width
                let _left = elAabb.left
                const parentAabb = target.getParent<Element2D>()?.globalAabb
                if (parentAabb) {
                  _left -= parentAabb.x
                }
                target.style.left = _left
                elAabb.x = left
                target.updateGlobalTransform()
              }
            }
            else {
              const target = sorted[index - 1]
              if (target) {
                // TODO 旋转
                let left = elAabb.right - target.globalAabb.width
                elAabb.x = target.globalAabb.left
                const parentAabb = target.getParent<Element2D>()?.globalAabb
                if (parentAabb) {
                  left -= parentAabb.x
                }
                target.style.left = left
                target.updateGlobalTransform()
              }
            }
          }
          break
        }
        case 'vertical': {
          const diff = center.y - fixedCenter.y
          const absDiff = Math.abs(diff)
          if (absDiff > spacing + elAabb.height / 2) {
            const sorted = [...elementSelection.value].sort((a, b) => {
              if (a.equal(el))
                return elAabb.y - b.globalAabb.y
              if (b.equal(el))
                return a.globalAabb.y - elAabb.y
              return a.globalAabb.y - b.globalAabb.y
            })
            const index = sorted.findIndex(v => v.equal(el))
            if (diff > 0) {
              const target = sorted[index + 1]
              if (target) {
                // TODO 旋转
                const top = target.globalAabb.bottom - elAabb.height
                let _top = elAabb.top
                const parentAabb = target.getParent<Element2D>()?.globalAabb
                if (parentAabb) {
                  _top -= parentAabb.y
                }
                target.style.top = _top
                elAabb.y = top
                target.updateGlobalTransform()
              }
            }
            else {
              const target = sorted[index - 1]
              if (target) {
                // TODO 旋转
                let top = elAabb.bottom - target.globalAabb.height
                elAabb.y = target.globalAabb.top
                const parentAabb = target.getParent<Element2D>()?.globalAabb
                if (parentAabb) {
                  top -= parentAabb.y
                }
                target.style.top = top
                target.updateGlobalTransform()
              }
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
      el.updateGlobalTransform()
      globalAabb.value = undefined
      state.value = undefined
      disableUpdate.value = false
    },
  })
}

function onSpacingMouseDown(event: MouseEvent) {
  const _info = info.value

  if (!_info) {
    return
  }

  const { direction, items } = _info

  handleDrag(event, {
    start: () => state.value = 'moving',
    move: (offset) => {
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
    end: () => state.value = undefined,
  })
}
</script>

<template>
  <div
    v-if="info"
    class="mce-smart-selection"
    :class="{
      'mce-smart-selection--hover': isPointerInSelection,
      [`mce-smart-selection--${info.direction}`]: true,
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
          @mousedown="onRingMouseDown($event, item)"
        />
      </div>

      <div
        v-for="(item, index) in spacingHandles"
        :key="index"
        class="mce-smart-selection__spacing"
        :style="item.style"
        @mousedown="onSpacingMouseDown($event)"
      >
        <div class="mce-smart-selection__spacing-line" />
      </div>

      <TransformControls
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
      v-else-if="_globalAabb"
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
      height: 10px;
      width: 10px;
      visibility: hidden;
      pointer-events: auto;
      display: flex;
      align-items: center;
      justify-content: center;

      &-line {
        width: 100%;
        height: 100%;
        background-color: #FF24BD;
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
      #{$root}__spacing {
        height: 4px;
        cursor: row-resize;
      }

      #{$root}__spacing-line {
        height: 1px;
      }
    }

    &--horizontal {
      #{$root}__spacing {
        width: 4px;
        cursor: col-resize;
      }

      #{$root}__spacing-line {
        width: 1px;
      }
    }
  }
</style>

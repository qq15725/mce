<script setup lang="ts">
import type { Element2D } from 'modern-canvas'
import type { TransformableValue } from './shared/TransformControls.vue'
import { computed, ref, watch } from 'vue'
import { useEditor } from '../composables'
import TransformControls from './shared/TransformControls.vue'

const currentElement = defineModel<Element2D>()

const {
  elementSelection,
  getObb,
  getAabb,
  state,
  camera,
  resizeElement,
  inEditorIs,
} = useEditor()

const info = ref({
  active: false,
  spacing: undefined as number | undefined,
})

function update() {
  if (currentElement.value) {
    return
  }

  const els = elementSelection.value
  let active = false
  let spacing: number | undefined

  if (state.value !== 'transforming' && els.length > 1) {
    let prev

    const items = els.map(el => ({ el, aabb: getAabb(el) }))

    active = true
    const sorted = [...items].sort((a, b) => a.aabb.y - b.aabb.y)
    for (let i = 0; i < sorted.length; i++) {
      const cur = sorted[i]
      if (prev) {
        if (!cur.aabb.overlap(prev.aabb, 'x')) {
          active = false
          break
        }
        const _spacing = cur.aabb.y - (prev.aabb.y + prev.aabb.height)
        if (spacing !== undefined && Math.abs(spacing - _spacing) >= 1) {
          active = false
          break
        }
        spacing = _spacing
      }
      prev = cur
    }

    if (!active) {
      active = true
      prev = undefined
      spacing = undefined
      const sorted = [...items].sort((a, b) => a.aabb.x - b.aabb.x)
      for (let i = 0; i < sorted.length; i++) {
        const cur = sorted[i]
        if (prev) {
          if (!cur.aabb.overlap(prev.aabb, 'y')) {
            active = false
            break
          }
          const _spacing = cur.aabb.x - (prev.aabb.x + prev.aabb.width)
          if (spacing !== undefined && Math.abs(spacing - _spacing) >= 1) {
            active = false
            break
          }
          spacing = _spacing
        }
        prev = cur
      }
    }
  }

  info.value = {
    active,
    spacing,
  }
}

watch(() => elementSelection.value.map(el => getAabb(el)), update)

watch(
  state,
  () => {
    currentElement.value = undefined
  },
)

const handles = computed(() => {
  return elementSelection.value.map((el) => {
    return {
      el,
      style: getObb(el, 'drawboard').toCssStyle(),
    }
  })
})

const _transform = computed(() => {
  const { left, top, width, height, rotationDegrees: rotate } = getObb(
    currentElement.value,
    'drawboard',
  )
  return { left, top, width, height, rotate }
})

const transform = computed({
  get: () => _transform.value,
  set: (val: TransformableValue) => {
    const zoom = camera.value.zoom
    const oldTransform = _transform.value
    const transform = {
      left: val.left / zoom.x,
      top: val.top / zoom.y,
      width: Math.max(1, val.width / zoom.x),
      height: Math.max(1, val.height / zoom.y),
    }
    const offsetStyle = {
      left: transform.left - oldTransform.left / zoom.x,
      top: transform.top - oldTransform.top / zoom.y,
      width: transform.width - oldTransform.width / zoom.x,
      height: transform.height - oldTransform.height / zoom.y,
    }
    const el = currentElement.value!
    const style = el.style
    const newStyle = {
      left: style.left + offsetStyle.left,
      top: style.top + offsetStyle.top,
      width: style.width + offsetStyle.width,
      height: style.height + offsetStyle.height,
    }

    const newWidth = Math.max(1, newStyle.width)
    const newHeight = Math.max(1, newStyle.height)
    const shape = el.shape
    resizeElement(
      el,
      newWidth,
      newHeight,
      inEditorIs(el, 'Frame')
        ? undefined
        : shape.isValid()
          ? { deep: true }
          : { deep: true, textToFit: true },
    )
    newStyle.width = el.style.width
    newStyle.height = el.style.height

    Object.assign(style, newStyle)

    el.updateGlobalTransform()
  },
})
</script>

<template>
  <div
    v-if="info.active"
    class="mce-smart-selection"
  >
    <div
      v-for="(item, index) in handles"
      :key="index"
      class="mce-smart-handle"
      :class="{
        'mce-smart-handle--active': item.el.equal(currentElement),
      }"
      :style="item.style"
    >
      <div
        class="mce-smart-handle__btn"
        @click="currentElement = item.el"
      />
    </div>

    <TransformControls
      v-if="transform.width && transform.height"
      v-model="transform"
      :handles="['resize-l', 'resize-r', 'resize-t', 'resize-b']"
      class="mce-smart-selection__transform"
      color="#FF24BD"
    />
  </div>
</template>

<style lang="scss">
  .mce-smart-selection {
    position: absolute;
    overflow: hidden;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;

    .mce-smart-handle {
      position: absolute;
      display: flex;
      align-items: center;
      justify-content: center;

      &--active > .mce-smart-handle__btn {
        background: #FF24BD;
      }

      &__btn {
        pointer-events: auto;
        width: 10px;
        height: 10px;
        border-radius: 100%;
        border: 1px solid #FF24BD;
        outline: 1px solid #FFFFFF;

        &:hover {
          background: #FF24BD;
        }
      }
    }
  }
</style>

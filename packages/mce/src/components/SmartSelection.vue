<script setup lang="ts">
import type { Element2D } from 'modern-canvas'
import type { TransformableValue } from './shared/TransformControls.vue'
import { computed, ref } from 'vue'
import { useEditor } from '../composables'
import TransformControls from './shared/TransformControls.vue'

const {
  elementSelection,
  getObb,
  state,
  camera,
  resizeElement,
  inEditorIs,
} = useEditor()

const currentElement = ref<Element2D>()

const info = computed(() => {
  const els = elementSelection.value
  let active = false
  let spacing: number | undefined

  const items = els.map((el) => {
    return {
      el,
      aabb: el.getGlobalAabb(),
    }
  })

  if (els.length > 1) {
    let prev

    active = true
    items.sort((a, b) => a.aabb.x - b.aabb.x)
    for (let i = 0; i < items.length; i++) {
      const cur = items[i]
      if (prev) {
        if (!cur.aabb.overlap(prev.aabb, 'y')) {
          active = false
          break
        }
        const _spacingX = cur.aabb.x - prev.aabb.x
        if (spacing !== undefined && spacing !== _spacingX) {
          active = false
          break
        }
        spacing = _spacingX
      }
      prev = cur
    }

    if (!active) {
      active = true
      prev = undefined
      spacing = undefined
      items.sort((a, b) => a.aabb.y - b.aabb.y)
      for (let i = 0; i < items.length; i++) {
        const cur = items[i]
        if (prev) {
          if (!cur.aabb.overlap(prev.aabb, 'x')) {
            active = false
            break
          }
          const _spacingX = cur.aabb.y - prev.aabb.y
          if (spacing !== undefined && spacing !== _spacingX) {
            active = false
            break
          }
          spacing = _spacingX
        }
        prev = cur
      }
    }
  }

  return {
    active,
    spacing,
    items,
  }
})

const handles = computed(() => {
  return elementSelection.value.map((el) => {
    return {
      el,
      style: getObb(el, 'drawboard').toCssStyle(),
    }
  })
})

const _transform = computed(() => {
  const { left, top, width, height, rotationDegrees } = getObb(currentElement.value, 'drawboard')
  return {
    left,
    top,
    width,
    height,
    rotate: rotationDegrees,
  }
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
    v-if="state !== 'transforming' && info.active"
    class="mce-smart-selection"
  >
    <div
      v-for="(item, index) in handles"
      :key="index"
      class="mce-smart-handle"
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

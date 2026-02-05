<script setup lang="ts">
import type { Aabb2D, Element2D } from 'modern-canvas'
import type { TransformValue } from './shared/TransformControls.vue'
import { computed, ref, watch } from 'vue'
import { useEditor } from '../composables'
import TransformControls from './shared/TransformControls.vue'

const currentElement = defineModel<Element2D>()

const {
  isPointerInSelection,
  elementSelection,
  getObb,
  getAabb,
  state,
  camera,
  resizeElement,
  inEditorIs,
  getGlobalPointer,
  aabbToDrawboardAabb,
} = useEditor()

const info = ref({
  active: false,
  direction: undefined as 'vertical' | 'horizontal' | undefined,
  spacing: undefined as number | undefined,
  items: [] as { el: Element2D, aabb: Aabb2D }[],
})

function update() {
  if (currentElement.value) {
    return
  }

  const els = elementSelection.value
  let active = false
  let direction: 'vertical' | 'horizontal' | undefined
  let spacing: number | undefined
  let items: { el: Element2D, aabb: Aabb2D }[] = []

  if (els.length > 1) {
    let prev

    const _els = els.map(el => ({ el, aabb: el.globalAabb }))

    active = true
    const sorted = [..._els].sort((a, b) => a.aabb.y - b.aabb.y)
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

    if (active) {
      items = sorted
      direction = 'vertical'
    }
    else {
      active = true
      prev = undefined
      spacing = undefined
      const sorted = [..._els].sort((a, b) => a.aabb.x - b.aabb.x)
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
      if (active) {
        items = sorted
        direction = 'horizontal'
      }
    }
  }

  info.value = {
    active,
    direction,
    spacing,
    items,
  }
}

watch(() => elementSelection.value.map(el => getAabb(el)), update)
watch(elementSelection, () => currentElement.value = undefined)

const handles = computed(() => {
  return elementSelection.value.map((el) => {
    return {
      el,
      style: getObb(el, 'drawboard').toCssStyle(),
    }
  })
})

const spacingHandles = computed(() => {
  const { direction, spacing = 0, items } = info.value
  const zoom = camera.value.zoom
  const position = camera.value.position

  switch (direction) {
    case 'horizontal':
      return items.map((item) => {
        const pos = {
          x: item.aabb.x + spacing / 2,
          y: item.aabb.y,
        }
        pos.x *= zoom.x
        pos.y *= zoom.y
        pos.x -= position.x
        pos.y -= position.y
        return {
          style: {
            width: '2px',
            transform: `matrix(1, 0, 0, 1, ${pos.x}, ${pos.y})`,
          },
        }
      })
    case 'vertical':
      return items.slice(0, items.length - 1).map((item) => {
        const pos = {
          x: item.aabb.x,
          y: item.aabb.y + item.aabb.height + spacing / 2,
        }
        pos.x *= zoom.x
        pos.y *= zoom.y
        pos.x -= position.x
        pos.y -= position.y
        pos.y -= 1
        return {
          style: {
            height: '2px',
            transform: `matrix(1, 0, 0, 1, ${pos.x}, ${pos.y})`,
          },
        }
      })
  }

  return []
})

const transform = computed({
  get: () => {
    const { left, top, width, height, rotationDegrees: rotate } = getObb(currentElement.value)
    return { left, top, width, height, rotate }
  },
  set: (val: TransformValue) => {
    const oldTransform = transform.value
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

    const { direction, items } = info.value

    let after = false
    switch (direction) {
      case 'horizontal':
        items.forEach((item) => {
          if (item.el.equal(el)) {
            after = true
          }
          else if (after) {
            item.el.style.left += offset.right
          }
          else {
            item.el.style.left += offset.left
          }
        })
        break
      case 'vertical':
        items.forEach((item) => {
          if (item.el.equal(el)) {
            after = true
          }
          else if (after) {
            item.el.style.top += offset.bottom
          }
          else {
            item.el.style.top += offset.top
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

function onMouseDown(item: any, downEvent: MouseEvent) {
  const el = item.el as Element2D
  currentElement.value = el

  // TODO
  let currentPos = { x: downEvent.clientX, y: downEvent.clientY }
  globalAabb.value = el.globalAabb.clone()
  const elAabb = globalAabb.value
  const startItems: { el: Element2D, aabb: Aabb2D }[] = []
  elementSelection.value.forEach((el) => {
    startItems.push({
      el,
      aabb: el.globalAabb,
    })
  })

  let startDrag = false
  function onMouseMove(moveEvent: MouseEvent) {
    const movePos = { x: moveEvent.clientX, y: moveEvent.clientY }
    const offset = { x: movePos.x - currentPos.x, y: movePos.y - currentPos.y }

    if (!startDrag && (
      Math.abs(offset.x) >= 3
      || Math.abs(offset.y) >= 3
    )) {
      startDrag = true
      state.value = 'moving'
    }

    if (startDrag) {
      currentPos = { ...movePos }

      const { zoom } = camera.value
      el.position.x += offset.x / zoom.x
      el.position.y += offset.y / zoom.y

      const pointer = getGlobalPointer()
      switch (info.value.direction) {
        case 'vertical':
          startItems.forEach((target) => {
            if (!target.el.equal(el)) {
              if (
                target.aabb.top < pointer.y
                && target.aabb.bottom > pointer.y
              ) {
                if (target.aabb.top < elAabb.top) {
                  const top = target.aabb.top
                  target.el.style.top = elAabb.bottom - target.aabb.height
                  elAabb.top = top
                }
                else {
                  const top = elAabb.top
                  elAabb.top = target.aabb.bottom - elAabb.height
                  target.el.style.top = top
                }
                target.el.updateGlobalTransform()
              }
            }
          })
          break
        case 'horizontal':
          // TODO
          break
      }
    }
  }

  function onMouseUp(_upEvent: MouseEvent) {
    el.style.left = elAabb.x
    el.style.top = elAabb.y
    el.position.x = elAabb.x
    el.position.y = elAabb.y
    el.updateGlobalTransform()
    globalAabb.value = undefined
    state.value = undefined

    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
  }

  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}
</script>

<template>
  <div
    v-if="info.active"
    class="mce-smart-selection"
  >
    <template
      v-if="state !== 'moving'"
    >
      <div
        v-for="(item, index) in handles"
        :key="index"
        class="mce-smart-handle"
        :class="{
          'mce-smart-handle--active': item.el.equal(currentElement),
        }"
        :style="item.style"
        data-pointerdown_to_drawboard
      >
        <div
          class="mce-smart-handle__btn"
          :class="{
            'mce-smart-handle__btn--active': isPointerInSelection,
          }"
          @mousedown="onMouseDown(item, $event)"
        />
      </div>

      <div
        v-for="(item, index) in spacingHandles"
        :key="index"
        class="mce-smart-spacing-handle"
        :style="item.style"
        data-pointerdown_to_drawboard
      />

      <TransformControls
        v-if="transform.width && transform.height"
        v-model="transform"
        :handles="['resize-l', 'resize-r', 'resize-t', 'resize-b']"
        class="mce-smart-selection__transform"
        color="#FF24BD"
        :scale="[camera.zoom.x, camera.zoom.y]"
        :offset="[-camera.position.x, -camera.position.y]"
      />
    </template>

    <div
      v-else-if="_globalAabb"
      class="mce-smart-drag"
      :style="_globalAabb.toCssStyle()"
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

    .mce-smart-drag {
      position: absolute;
      border: 1px solid rgb(var(--mce-theme-primary));
    }

    .mce-smart-handle {
      position: absolute;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: auto;

      &__btn {
        width: 1px;
        height: 1px;
        border-radius: 100%;
        border: 1px solid #FF24BD;
        outline: 1px solid #FFFFFF;

        &:hover {
          background: #FF24BD;
        }

        &--active {
          width: 10px;
          height: 10px;
        }
      }

      &--active .mce-smart-handle__btn {
        background: #FF24BD;
      }
    }

    .mce-smart-spacing-handle {
      position: absolute;
      background-color: #FF24BD;
      height: 20px;
      width: 20px;
    }
  }
</style>

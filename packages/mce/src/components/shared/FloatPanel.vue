<script setup lang="ts">
import type { OrientedBoundingBox } from '../../types'
import { computed, onBeforeUnmount, ref } from 'vue'
import { useEditor } from '../../composables'
import { addDragListener } from '../../utils'
import PanelContent from './PanelContent.vue'

const props = defineProps<{
  /** 面板唯一标识，接入面板状态源（层叠 / 位置记忆）。 */
  name: string
  title?: string
  defaultTransform?: Partial<OrientedBoundingBox>
}>()

const isActive = defineModel<boolean>()

const editor = useEditor()
const { panels } = editor

const MIN_WIDTH = 200
const MIN_HEIGHT = 160

const CASCADE_STEP = 28
const FALLBACK = { width: 300, height: 600, left: 60, top: 60 }

function initialTransform() {
  const saved = panels.transformRef(props.name).value
  if (saved)
    return { ...FALLBACK, ...saved }
  // 无记忆时按当前已开浮窗数做层叠偏移，避免新开面板完全重叠。
  const offset = panels.floatOrder.value.length * CASCADE_STEP
  const base = { ...FALLBACK, ...props.defaultTransform }
  return { ...base, left: base.left + offset, top: base.top + offset }
}

// 先按当前已开浮窗数算层叠偏移（此时本面板尚未入栈），再入栈置顶。
const transform = ref(initialTransform())

function toFront(): void {
  panels.bringToFront(props.name)
}

// 同步入栈（非 onMounted），保证同一 tick 内多个面板的层叠序与偏移互不冲突。
toFront()
onBeforeUnmount(() => panels.release(props.name))

// z-index 由层叠栈驱动，点击置顶。
const zIndex = computed(() => panels.floatZIndex(props.name))

type Handle = 'move' | 'e' | 's' | 'se'

function persist(): void {
  panels.setTransform(props.name, { ...transform.value })
  // setTransform 会做边界约束，回读以同步本地（标题栏始终留在画布内）。
  const clamped = panels.transformRef(props.name).value
  if (clamped) {
    transform.value = { ...transform.value, ...clamped }
  }
}

function onHandleDown(event: PointerEvent, handle: Handle): void {
  if (event.button !== 0)
    return
  event.preventDefault()
  event.stopPropagation()
  toFront()
  const start = { ...transform.value }
  addDragListener(event, {
    move: (ctx) => {
      const dx = ctx.movePoint.x - ctx.startPoint.x
      const dy = ctx.movePoint.y - ctx.startPoint.y
      if (handle === 'move') {
        transform.value = { ...transform.value, left: start.left + dx, top: start.top + dy }
      }
      else {
        const next = { ...transform.value }
        if (handle === 'e' || handle === 'se')
          next.width = Math.max(MIN_WIDTH, start.width + dx)
        if (handle === 's' || handle === 'se')
          next.height = Math.max(MIN_HEIGHT, start.height + dy)
        transform.value = next
      }
    },
    end: persist,
  })
}

const style = computed(() => ({
  width: `${transform.value.width}px`,
  height: `${transform.value.height}px`,
  transform: `translate(${transform.value.left}px, ${transform.value.top}px)`,
  zIndex: zIndex.value,
}))

const defaultSlotProps = {
  isActive,
}
</script>

<template>
  <div
    v-if="isActive"
    class="m-float-panel"
    :style="style"
    @pointerdown="toFront"
    @wheel.stop
  >
    <div class="m-float-panel__card">
      <PanelContent
        :title="title"
        closable
        @close="isActive = false"
        @header-pointerdown="(e: PointerEvent) => onHandleDown(e, 'move')"
      >
        <slot v-bind="defaultSlotProps" />
      </PanelContent>

      <div class="m-float-panel__resize m-float-panel__resize--e" @pointerdown="(e: PointerEvent) => onHandleDown(e, 'e')" />
      <div class="m-float-panel__resize m-float-panel__resize--s" @pointerdown="(e: PointerEvent) => onHandleDown(e, 's')" />
      <div class="m-float-panel__resize m-float-panel__resize--se" @pointerdown="(e: PointerEvent) => onHandleDown(e, 'se')" />
    </div>
  </div>
</template>

<style lang="scss">
  .m-float-panel {
    position: absolute;
    left: 0;
    top: 0;
    pointer-events: auto !important;

    &__card {
      position: relative;
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      border-radius: 12px;
      background-color: rgb(var(--m-theme-surface));
      box-shadow: var(--m-shadow);
      overflow: hidden;
    }

    // 浮动面板标题栏作为拖拽来源。
    .m-panel__header {
      cursor: move;
    }

    &__resize {
      position: absolute;
      z-index: 1;

      &--e {
        top: 0;
        right: 0;
        width: 6px;
        height: 100%;
        cursor: ew-resize;
      }

      &--s {
        left: 0;
        bottom: 0;
        width: 100%;
        height: 6px;
        cursor: ns-resize;
      }

      &--se {
        right: 0;
        bottom: 0;
        width: 14px;
        height: 14px;
        cursor: nwse-resize;
      }
    }
  }
</style>

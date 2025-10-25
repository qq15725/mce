<script setup lang="ts">
import type { Cursor, PointerInputEvent } from 'modern-canvas'
import type { OrientedBoundingBox } from '../types'
import { useResizeObserver } from '@vueuse/core'
import { Element2D } from 'modern-canvas'
import {
  computed,
  nextTick,
  onBeforeMount,
  onBeforeUnmount,
  onMounted,
  provide,
  ref,
  useTemplateRef,
} from 'vue'
import { useEditor } from '../composables/editor'
import { createIcons, IconsSymbol } from '../composables/icons'
import { provideOverlay } from '../composables/overlay'
import {
  defaultActiveStrategy,
  defaultHoverStrategy,
  defaultResizeStrategy,
  makeMceStrategyProps,
} from '../composables/strategy'
import { Editor } from '../editor'
import { isPointInsideAabb } from '../utils/box'
import Auxiliary from './Auxiliary.vue'
import Bottombar from './Bottombar.vue'
import ContextMenu from './ContextMenu.vue'
import Drawing from './Drawing.vue'
import Floatbar from './Floatbar.vue'
import Frames from './Frames.vue'
import GoBackSelectedArea from './GoBackSelectedArea.vue'
import Hover from './Hover.vue'
import Rulers from './Rulers.vue'
import Scrollbars from './Scrollbars.vue'
import Selector from './Selector.vue'
import Setup from './Setup.vue'
import Statusbar from './Statusbar.vue'
import TextEditor from './TextEditor.vue'
import Timeline from './timeline/Timeline.vue'

const props = defineProps({
  ...makeMceStrategyProps({
    resizeStrategy: defaultResizeStrategy,
    activeStrategy: defaultActiveStrategy,
    hoverStrategy: defaultHoverStrategy,
  }),
  editor: Editor,
})

const emit = defineEmits<{
  'dblclick:drawboard': [event: Event]
}>()

defineSlots<{
  selector?: (props: { box: OrientedBoundingBox }) => void
  transformer?: (props: { box: Partial<OrientedBoundingBox> }) => void
  floatbar?: () => void
  bottombar?: () => void
  default?: () => void
}>()

let editor
if (props.editor) {
  provide(Editor.injectionKey, props.editor)
  editor = props.editor
}
else {
  editor = useEditor()
}

provide(IconsSymbol, createIcons())

const {
  config,
  drawboardDom,
  renderEngine,
  camera,
  bindRenderCanvas,
  hoverElement,
  state,
  setCursor,
  isFrame,
  selectArea,
  exec,
  isLock,
  selection,
  getAabbInDrawboard,
  drawboardAabb,
  drawboardPointer,
} = editor

const overlayContainer = useTemplateRef('overlayContainerTpl')
const canvas = useTemplateRef('canvasTpl')
const selector = useTemplateRef('selectorTpl')
const textEditor = useTemplateRef('textEditorTpl')
const selectedArea = ref({ left: 0, top: 0, width: 0, height: 0 })

provideOverlay({
  attach: computed(() => overlayContainer.value),
})

useResizeObserver(canvas, (entries) => {
  const { width, height } = entries[0].contentRect
  renderEngine.value.resize(width, height)
})

onBeforeMount(() => {
  renderEngine.value.on('pointerdown', onPointerdown)
  renderEngine.value.on('pointermove', onPointermove)
  renderEngine.value.on('pointerover', onPointerover)
})

onMounted(() => {
  bindRenderCanvas(canvas.value!, drawboardDom.value!)
})

onBeforeUnmount(() => {
  renderEngine.value.off('pointerdown', onPointerdown)
  renderEngine.value.off('pointermove', onPointermove)
  renderEngine.value.off('pointerover', onPointerover)
})

function isExcluded(element: Element2D): boolean {
  return isFrame(element)
}

function onHover(event: PointerInputEvent) {
  let cursor: Cursor | undefined
  let hovered: Element2D | undefined
  if (isPointInsideAabb(
    { x: event.clientX, y: event.clientY },
    getAabbInDrawboard(selection.value),
  )) {
    cursor = 'move'
  }
  else {
    const element = event.target
    const oldElement = selection.value[0]
    const result = props.hoverStrategy({
      element,
      oldElement,
      event,
      isExcluded,
    })
    if (result && !(result instanceof Element2D)) {
      hovered = result.element
      cursor = result.cursor
    }
    else {
      hovered = result
    }
  }
  hoverElement.value = hovered
  setCursor(cursor)
}

function onPointerdown(event: PointerInputEvent): void {
  if (
    (
      event.srcElement !== drawboardDom.value
      && (event.srcElement as HTMLElement).dataset?.pointerdown_to_drawboard === undefined
    )
    || camera.value.spaceKey
    || ![0, 2].includes(event.button)
  ) {
    return
  }

  const oldElement = selection.value[0]
  const element = event.target
  const start = { x: event.clientX, y: event.clientY }
  let current = { ...start }
  let dragging = false
  let isUp = false
  let selected: Element2D[] = []
  let ctxState: Mce.State | undefined
  const inSelected = isPointInsideAabb({
    x: start.x + -drawboardAabb.value.left,
    y: start.y + -drawboardAabb.value.top,
  }, getAabbInDrawboard(selection.value))

  if (event.button === 2) {
    if (!inSelected) {
      const result = props.activeStrategy({
        element,
        oldElement,
        event,
        isExcluded,
      })
      if (result && !(result instanceof Element2D)) {
        selected = result.element ? [result.element] : []
      }
      else {
        selected = result ? [result] : []
      }
      selection.value = selected
    }
    return
  }

  function onDrag(event: PointerInputEvent): void {
    const result = props.activeStrategy({
      element,
      oldElement,
      event,
      isExcluded,
    })
    if (result && !(result instanceof Element2D)) {
      selected = result.element ? [result.element] : []
    }
    else {
      selected = result ? [result] : []
    }
    selection.value = selected
  }

  function onSelectArea(): void {
    if (state.value !== 'selecting') {
      state.value = 'selecting'
    }
    selectedArea.value = {
      left: Math.min(start.x, current.x) - drawboardAabb.value.left,
      top: Math.min(start.y, current.y) - drawboardAabb.value.top,
      width: Math.abs(start.x - current.x),
      height: Math.abs(start.y - current.y),
    }
    selected = selectArea(selectedArea.value)
  }

  function onActivate() {
    const result = props.activeStrategy({
      element,
      oldElement,
      event,
      isExcluded: () => false,
    })

    let _element: Element2D | undefined
    if (result && !(result instanceof Element2D)) {
      _element = result.element
      ctxState = result.state
    }
    else {
      _element = result
    }

    if (_element && (event?.ctrlKey || event?.shiftKey || event?.metaKey)) {
      if (selection.value.findIndex(v => v.equal(_element)) > -1) {
        selected = selection.value.filter(v => !v.equal(_element))
      }
      else {
        selected = [...selection.value, _element]
      }
    }
    else {
      selected = _element ? [_element] : []
    }
  }

  function canStartDrag() {
    return !dragging
      && (
        Math.abs(current.x - start.x) >= 3
        || Math.abs(current.y - start.y) >= 3
      )
  }

  function onMove(event: PointerInputEvent) {
    current = { x: event.clientX, y: event.clientY }

    if (inSelected) {
      if (canStartDrag()) {
        dragging = true
        exec('startTransform')
      }
    }
    else {
      if (element && !isFrame(element)) {
        if (canStartDrag()) {
          dragging = true
          onDrag(event)
          nextTick(() => {
            if (!isUp) {
              exec('startTransform')
            }
          })
        }
      }
      else {
        onSelectArea()
      }
    }
  }

  async function onUp(_event: PointerEvent) {
    if (state.value) {
      state.value = undefined
    }

    if (!dragging) {
      if (element) {
        onActivate()
      }

      selection.value = selected

      if (ctxState) {
        if (selected[0] && !isLock(selected[0])) {
          switch (ctxState) {
            case 'typing': {
              await exec('startTyping', _event)
              break
            }
          }
        }
      }

      onHover(event)
    }

    renderEngine.value.off('pointermove', onMove)
    document.removeEventListener('pointerup', onUp)
    isUp = true
  }

  renderEngine.value.on('pointermove', onMove)
  document.addEventListener('pointerup', onUp)
}

function onPointermove(event: PointerInputEvent): void {
  if (event.srcElement !== drawboardDom.value) {
    return
  }

  drawboardPointer.value = { x: event.clientX, y: event.clientY }

  if (
    camera.value.grabbing
    || event.button === 1
    || (state.value && state.value !== 'typing')
  ) {
    return
  }

  onHover(event)
}

function onPointerover(): void {
  drawboardPointer.value = undefined
  hoverElement.value = undefined
  setCursor(undefined)
}

function onScroll() {
  if (drawboardDom.value) {
    if (drawboardDom.value.scrollLeft) {
      drawboardDom.value.scrollLeft = 0
    }
    if (drawboardDom.value.scrollTop) {
      drawboardDom.value.scrollTop = 0
    }
  }
}
</script>

<template>
  <div
    class="mce-drawboard"
    :class="`mce-drawboard--${config.viewMode}`"
  >
    <Setup />
    <div
      ref="drawboardDom"
      :data-pixel-ratio="renderEngine.pixelRatio"
      class="mce-drawboard__main"
      @dblclick="emit('dblclick:drawboard', $event)"
      @scroll="onScroll"
      @wheel.prevent
    >
      <canvas
        ref="canvasTpl"
        class="mce-drawboard__canvas"
      />
      <TextEditor ref="textEditorTpl" />
      <Auxiliary />
      <Hover />
      <Frames />
      <Drawing />
      <Selector
        ref="selectorTpl"
        :selected-area="selectedArea"
        :resize-strategy="selection[0] ? props.resizeStrategy(selection[0]) : undefined"
      >
        <template #transformable="{ box }">
          <slot name="transformer" :box="box" />
        </template>
        <template #default="{ box }">
          <slot name="selector" :box="box" />
        </template>
      </Selector>
      <Scrollbars v-if="config.scrollbar" />
      <Floatbar
        v-if="$slots.floatbar"
        :target="state === 'typing'
          ? textEditor?.textEditor
          : selector?.transformable?.$el"
      >
        <slot name="floatbar" />
      </Floatbar>
      <ContextMenu />
      <Bottombar v-if="config.bottombar">
        <slot name="bottombar" />
      </Bottombar>
      <GoBackSelectedArea />
      <slot />
    </div>
    <Rulers v-if="config.ruler" />
    <Timeline />
    <Statusbar v-if="config.statusbar" />
    <div
      ref="overlayContainerTpl"
      class="mce-drawboard__overlay-container"
    />
  </div>
</template>

<style lang="scss">
.mce-drawboard {
  --mce-theme-primary: 97, 101, 253;
  --mce-theme-on-primary: 247, 247, 248;
  --mce-theme-surface: 255, 255, 255;
  --mce-theme-on-surface: 56, 56, 56;
  --mce-theme-surface-variant: 35, 37, 41;
  --mce-theme-on-surface-variant: 255, 255, 255;
  --mce-theme-background: 240, 242, 245;
  --mce-theme-on-background: 56, 56, 56;
  --mce-border-color: 0, 0, 0;
  --mce-border-opacity: .08;
  --mce-high-emphasis-opacity: 1;
  --mce-medium-emphasis-opacity: 0.5;
  --mce-low-emphasis-opacity: 0.3;
  --mce-shadow: 0 8px 32px 2px rgba(0, 0, 0, 0.08), 0 0 1px rgba(0, 0, 0, 0.2);
}

.mce-drawboard {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: rgba(var(--mce-theme-surface), 1);
  color: rgba(var(--mce-theme-on-surface), 1);
  overflow: hidden;
  user-select: none;

  * {
    box-sizing: border-box;
  }

  &__overlay-container {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }

  &__main {
    position: relative;
    width: 100%;
    flex: 1;
    overflow: hidden;

    & > * {
      pointer-events: none;
    }
  }

  &__canvas {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    display: block;
  }
}
</style>

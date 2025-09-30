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
import { provideOverlay } from '../composables/overlay'
import {
  defaultActiveStrategy,
  defaultHoverStrategy,
  defaultResizeStrategy,
  makeMceStrategyProps,
} from '../composables/strategy'
import { Editor } from '../editor'
import { isPointInsideAabb } from '../utils/box'
import { easeInOut } from '../utils/easing'
import Auxiliary from './Auxiliary.vue'
import Bottombar from './Bottombar.vue'
import ContextMenu from './ContextMenu.vue'
import Drawing from './Drawing.vue'
import Floatbar from './Floatbar.vue'
import Frames from './Frames.vue'
import Hover from './Hover.vue'
import RulerXy from './RulerXy.vue'
import ScrollbarXy from './ScrollbarXy.vue'
import Selector from './Selector.vue'
import Starter from './Starter.vue'
import Statusbar from './Statusbar.vue'
import TextEditor from './TextEditor.vue'

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
  selector?: (box: OrientedBoundingBox) => void
  transformer?: (box: Partial<OrientedBoundingBox>) => void
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

const {
  config,
  drawboardDom,
  renderEngine,
  camera,
  bindRenderCanvas,
  activeElement,
  hoverElement,
  state,
  setState,
  setCursor,
  setActiveElement,
  setSelectedElements,
  isFrame,
  selectArea,
  exec,
  isLockedElement,
  currentElements,
  selectedElements,
  getAabbInDrawboard,
  drawboardAabb,
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
    getAabbInDrawboard(selectedElements.value),
  )) {
    cursor = 'move'
  }
  else {
    const element = event.target
    const oldElement = activeElement.value
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

  const oldElement = activeElement.value
  const element = event.target
  const start = { x: event.clientX, y: event.clientY }
  let current = { ...start }
  let dragging = false
  let isUp = false
  let activated: Element2D | undefined
  let selected: Element2D[] = []
  let ctxState: Mce.State | undefined
  const inSelected = isPointInsideAabb({
    x: start.x + -drawboardAabb.value.left,
    y: start.y + -drawboardAabb.value.top,
  }, getAabbInDrawboard(selectedElements.value))

  if (event.button === 2) {
    if (!inSelected) {
      const result = props.activeStrategy({
        element,
        oldElement,
        event,
        isExcluded,
      })
      if (result && !(result instanceof Element2D)) {
        activated = result.element
      }
      else {
        activated = result
      }
      setActiveElement(activated)
      setSelectedElements(selected)
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
      activated = result.element
    }
    else {
      activated = result
    }
    setActiveElement(activated)
  }

  function onSelectArea(): void {
    if (state.value !== 'selecting') {
      setState('selecting')
    }
    activated = undefined
    setActiveElement(activated)
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
      if (currentElements.value.findIndex(v => v.equal(_element)) > -1) {
        selected = currentElements.value.filter(v => !v.equal(_element))
      }
      else {
        selected = [...currentElements.value, _element]
      }
    }
    else {
      activated = _element
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
      setState(undefined)
    }

    if (!dragging) {
      if (element) {
        onActivate()
      }

      if (selected.length === 1) {
        activated = selected[0]
        selected = []
      }

      setActiveElement(activated)
      setSelectedElements(selected)

      if (ctxState) {
        if (activated && !isLockedElement(activated)) {
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
  if (
    event.srcElement !== drawboardDom.value
    || camera.value.grabbing
    || event.button === 1
    || (state.value && state.value !== 'typing')
  ) {
    return
  }

  onHover(event)
}

function onPointerover(): void {
  hoverElement.value = undefined
  setCursor(undefined)
}

// TODO 判断选中区域是否处于视口外
const isActivatedBoxOutsideViewport = computed(() => false)
function gotoActivatedBox() {
  // TODO 返回选中区域
}

const drawboardStyle = computed(() => {
  if (config.value.viewMode === 'edgeless') {
    const { position, zoom } = camera.value
    const w = 20 * zoom.x
    const h = 20 * zoom.y
    return {
      '--mce-grid-opacity': easeInOut(Math.min(1, zoom.x, zoom.y)) * 0.4,
      'backgroundPosition': `${w / 2 + position.x}px ${h / 2 + position.y}px`,
      'backgroundSize': `${w}px ${h}px`,
    }
  }
  return {}
})

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
    :style="drawboardStyle"
  >
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
        :resize-strategy="activeElement ? props.resizeStrategy(activeElement) : undefined"
      >
        <template #transformable="{ box }">
          <slot name="transformer" :box="box" />
        </template>

        <template #default="{ box }">
          <slot name="selector" :box="box" />
        </template>
      </Selector>
      <RulerXy v-if="config.ruler" />
      <ScrollbarXy v-if="config.scrollbar" />
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

      <div
        v-if="isActivatedBoxOutsideViewport"
        class="absolute left-1/2 bottom-10 px-2 py-1 flex items-center gap-1 text-sm bg-on-surface/60 text-surface rounded cursor-pointer"
        @click="gotoActivatedBox"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 256 256"><path fill="currentColor" d="M232 120h-8.34A96.14 96.14 0 0 0 136 32.34V24a8 8 0 0 0-16 0v8.34A96.14 96.14 0 0 0 32.34 120H24a8 8 0 0 0 0 16h8.34A96.14 96.14 0 0 0 120 223.66V232a8 8 0 0 0 16 0v-8.34A96.14 96.14 0 0 0 223.66 136H232a8 8 0 0 0 0-16m-96 87.6V200a8 8 0 0 0-16 0v7.6A80.15 80.15 0 0 1 48.4 136H56a8 8 0 0 0 0-16h-7.6A80.15 80.15 0 0 1 120 48.4V56a8 8 0 0 0 16 0v-7.6a80.15 80.15 0 0 1 71.6 71.6H200a8 8 0 0 0 0 16h7.6a80.15 80.15 0 0 1-71.6 71.6M128 88a40 40 0 1 0 40 40a40 40 0 0 0-40-40m0 64a24 24 0 1 1 24-24a24 24 0 0 1-24 24" /></svg>
        <span>返回选中区域</span>
      </div>

      <Starter v-if="false" />

      <slot />
    </div>

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

  * {
    box-sizing: border-box;
  }

  &--edgeless {
    --mce-grid-opacity: 0.5;
    background-image: radial-gradient(rgba(var(--mce-theme-on-surface), var(--mce-grid-opacity)) 1px, rgba(var(--mce-theme-surface), var(--mce-grid-opacity)) 1px);
    background-repeat: repeat;
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

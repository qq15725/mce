<script setup lang="ts">
import type { Cursor, Element2D, PointerInputEvent } from 'modern-canvas'
import type { OrientedBoundingBox } from '../types'
import { useResizeObserver } from '@vueuse/core'
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
import { provideEditor, useEditor } from '../composables/editor'
import { createIcons, IconsSymbol } from '../composables/icons'
import { provideOverlay } from '../composables/overlay'
import {
  defaultActiveStrategy,
  defaultDoubleclickStrategy,
  defaultHoverStrategy,
  defaultResizeStrategy,
  makeMceStrategyProps,
} from '../composables/strategy'
import { Editor } from '../editor'
import { isPointInsideAabb } from '../utils/box'
import Auxiliary from './Auxiliary.vue'
import ContextMenu from './ContextMenu.vue'
import Drawing from './Drawing.vue'
import Floatbar from './Floatbar.vue'
import ForegroundCropper from './ForegroundCropper.vue'
import Frames from './Frames.vue'
import GoBackSelectedArea from './GoBackSelectedArea.vue'
import Hover from './Hover.vue'
import Layers from './Layers.vue'
import MadeWith from './MadeWith.vue'
import Rulers from './Rulers.vue'
import Scrollbars from './Scrollbars.vue'
import Selector from './Selector.vue'
import FloatPanel from './shared/FloatPanel.vue'
import Layout from './shared/Layout.vue'
import LayoutItem from './shared/LayoutItem.vue'
import Main from './shared/Main.vue'
import Statusbar from './Statusbar.vue'
import TextEditor from './TextEditor.vue'
import Timeline from './timeline/Timeline.vue'
import Toolbelt from './Toolbelt.vue'

const props = defineProps({
  ...makeMceStrategyProps({
    resizeStrategy: defaultResizeStrategy,
    activeStrategy: defaultActiveStrategy,
    doubleclickStrategy: defaultDoubleclickStrategy,
    hoverStrategy: defaultHoverStrategy,
  }),
  editor: Editor,
})

defineSlots<{
  'selector'?: (props: { box: OrientedBoundingBox }) => void
  'transformer'?: (props: { box: Partial<OrientedBoundingBox> }) => void
  'floatbar'?: () => void
  'floatbar-top'?: () => void
  'floatbar-bottom'?: () => void
  'drawboard'?: () => void
  'default'?: () => void
}>()

let editor: Editor
if (props.editor) {
  editor = provideEditor(props.editor)
}
else {
  editor = useEditor()
}

editor.setup()

provide(IconsSymbol, createIcons())

const {
  isElement,
  showMadeWith,
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
  elementSelection,
  getAabbInDrawboard,
  drawboardAabb,
  drawboardPointer,
  screenCenterOffset,
  t,
} = editor

const overlayContainer = useTemplateRef('overlayContainerTpl')
const canvas = useTemplateRef('canvasTpl')
const selector = useTemplateRef('selectorTpl')
const textEditor = useTemplateRef('textEditorTpl')
const selectedArea = ref({ left: 0, top: 0, width: 0, height: 0 })
const resizeStrategy = computed(() => {
  const first = elementSelection.value[0]
  if (first) {
    if (first.text.isValid()) {
      return 'lockAspectRatioDiagonal'
    }
    return props.resizeStrategy(first)
  }
  return undefined
})

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

function onHover(event: PointerInputEvent) {
  let cursor: Cursor | undefined
  let hovered: Element2D | undefined
  if (
    elementSelection.value.length > 1
    && isPointInsideAabb(
      { x: event.clientX, y: event.clientY },
      getAabbInDrawboard(elementSelection.value),
    )
  ) {
    cursor = 'move'
  }
  else {
    const element = event.target
    const result = props.hoverStrategy({
      element,
      event,
      editor,
    })
    if (result && !isElement(result)) {
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

function onPointerdown(downEvent: PointerInputEvent): void {
  if (
    (
      downEvent.srcElement !== drawboardDom.value
      && (downEvent.srcElement as HTMLElement).dataset?.pointerdown_to_drawboard === undefined
    )
    || camera.value.spaceKey
    || ![0, 2].includes(downEvent.button)
  ) {
    return
  }

  const element = downEvent.target
  const start = { x: downEvent.clientX, y: downEvent.clientY }
  let current = { ...start }
  let dragging = false
  let selecting = false
  let isUp = false
  let selected: Element2D[] = []
  let ctxState: Mce.State | undefined
  const inSelection = isPointInsideAabb({
    x: start.x + -drawboardAabb.value.left,
    y: start.y + -drawboardAabb.value.top,
  }, getAabbInDrawboard(elementSelection.value))

  if (downEvent.button === 2) {
    if (!inSelection) {
      const result = props.activeStrategy({
        element,
        event: downEvent,
        editor,
      })
      if (result && !isElement(result)) {
        selected = result.element ? [result.element] : []
      }
      else {
        selected = result ? [result] : []
      }
      elementSelection.value = selected
    }
    return
  }

  function onDrag(event: PointerInputEvent): void {
    const result = props.activeStrategy({
      element,
      event,
      editor,
    })
    if (result && !isElement(result)) {
      selected = result.element ? [result.element] : []
    }
    else {
      selected = result ? [result] : []
    }
    elementSelection.value = selected
  }

  function onSelectArea(): void {
    selecting = true
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
      event: downEvent,
      editor,
    })

    let _element: Element2D | undefined
    if (result && !isElement(result)) {
      _element = result.element
      ctxState = result.state
    }
    else {
      _element = result
    }

    if (_element && (downEvent?.ctrlKey || downEvent?.shiftKey || downEvent?.metaKey)) {
      if (elementSelection.value.findIndex(v => v.equal(_element)) > -1) {
        selected = elementSelection.value.filter(v => !v.equal(_element))
      }
      else {
        selected = [...elementSelection.value, _element]
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

  function onEngineMove(moveEvent: PointerInputEvent) {
    if (inSelection) {
      if (canStartDrag()) {
        dragging = true
        exec('startTransform', downEvent)
      }
    }
    else {
      if (element && !isFrame(element)) {
        if (canStartDrag()) {
          dragging = true
          onDrag(moveEvent)
          nextTick(() => {
            if (!isUp) {
              exec('startTransform', downEvent)
            }
          })
        }
      }
    }
  }

  function onMove(moveEvent: PointerEvent) {
    current = { x: moveEvent.clientX, y: moveEvent.clientY }
    if (!inSelection) {
      if (!element || isFrame(element)) {
        onSelectArea()
      }
    }
  }

  async function onUp(upEvent: PointerEvent) {
    if (state.value) {
      state.value = undefined
    }

    if (!dragging) {
      if (element && !selecting) {
        onActivate()
      }

      elementSelection.value = selected

      if (ctxState) {
        if (selected[0] && !isLock(selected[0])) {
          switch (ctxState) {
            case 'typing': {
              await exec('startTyping', upEvent)
              break
            }
          }
        }
      }

      onHover(downEvent)
    }

    renderEngine.value.off('pointermove', onEngineMove)
    document.removeEventListener('pointermove', onMove)
    document.removeEventListener('pointerup', onUp)
    isUp = true
  }

  renderEngine.value.on('pointermove', onEngineMove)
  document.addEventListener('pointermove', onMove)
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

async function onDoubleclick(event: MouseEvent) {
  const state = props.doubleclickStrategy({
    event: event as any,
    editor,
  })
  switch (state) {
    case 'typing': {
      await exec('startTyping', event)
      break
    }
  }
}

const slotProps = {
  editor,
}
</script>

<template>
  <Layout class="mce-editor">
    <Main>
      <div
        ref="drawboardDom"
        class="mce-editor__drawboard"
        :data-pixel-ratio="renderEngine.pixelRatio"
        @dblclick="onDoubleclick($event)"
        @scroll="onScroll"
        @wheel.prevent
      >
        <canvas
          ref="canvasTpl"
          class="mce-editor__canvas"
        />

        <TextEditor ref="textEditorTpl" />
        <Auxiliary />
        <Hover />
        <Frames />
        <Drawing />
        <Rulers v-if="config.ruler" />
        <Scrollbars v-if="config.scrollbar" />
        <MadeWith v-if="showMadeWith" />
        <Selector
          ref="selectorTpl"
          :selected-area="selectedArea"
          :resize-strategy="resizeStrategy"
        >
          <template #transformable="{ box }">
            <slot name="transformer" :box="box" v-bind="slotProps" />
          </template>

          <template #default="{ box }">
            <ForegroundCropper />
            <slot name="selector" :box="box" v-bind="slotProps" />
          </template>
        </Selector>
        <Floatbar
          v-if="$slots.floatbar || $slots['floatbar-top']"
          location="top-start"
          :target="state === 'typing'
            ? textEditor?.textEditor
            : selector?.transformable?.$el"
        >
          <slot name="floatbar" v-bind="slotProps" />
          <slot name="floatbar-top" v-bind="slotProps" />
        </Floatbar>
        <Floatbar
          v-if="$slots['floatbar-bottom']"
          location="bottom-start"
          :target="selector?.transformable?.$el"
        >
          <slot name="floatbar-bottom" v-bind="slotProps" />
        </Floatbar>
        <ContextMenu />
        <GoBackSelectedArea />
        <FloatPanel
          v-if="config.layers"
          v-model="config.layers"
          :title="t('layers')"
          :default-transform="{
            width: 240,
            height: drawboardAabb.height * .7,
            top: screenCenterOffset.top + 24,
            left: screenCenterOffset.left + 24,
          }"
        >
          <Layers />
        </FloatPanel>
        <Toolbelt />
        <slot name="drawboard" v-bind="slotProps" />
      </div>
    </Main>

    <slot v-bind="slotProps" />

    <LayoutItem
      v-model="config.statusbar"
      position="bottom"
      :size="24"
    >
      <Statusbar />
    </LayoutItem>

    <LayoutItem
      v-model="config.timeline"
      position="bottom"
      :size="160"
    >
      <Timeline />
    </LayoutItem>

    <div
      ref="overlayContainerTpl"
      class="mce-editor__overlay-container"
    />
  </Layout>
</template>

<style lang="scss">
.mce-editor {
  --mce-theme-primary: 69, 151, 248;
  --mce-theme-on-primary: 255, 255, 255;
  --mce-theme-surface: 255, 255, 255;
  --mce-theme-on-surface: 30, 30, 30;
  --mce-theme-surface-variant: 35, 37, 41;
  --mce-theme-on-surface-variant: 255, 255, 255;
  --mce-theme-background: 240, 242, 245;
  --mce-theme-on-background: 56, 56, 56;
  --mce-border-color: 0, 0, 0;
  --mce-border-opacity: .08;
  --mce-high-emphasis-opacity: 1;
  --mce-medium-emphasis-opacity: 0.5;
  --mce-low-emphasis-opacity: 0.3;
  --mce-hover-opacity: 0.04;
  --mce-activated-opacity: 0.06;
  --mce-shadow: 0 8px 32px 2px rgba(0, 0, 0, 0.08), 0 0 1px rgba(0, 0, 0, 0.2);
  --mce-blur: 8px;

  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: rgb(var(--mce-theme-surface));
  color: rgb(var(--mce-theme-on-surface));
  overflow: hidden;
  user-select: none;
  cursor: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iMzJweCIgaGVpZ2h0PSIzMnB4Ij48aW1hZ2UgeGxpbms6aHJlZj0iZGF0YTppbWFnZS9wbmc7YmFzZTY0LGlWQk9SdzBLR2dvQUFBQU5TVWhFVWdBQUFFQUFBQUJBQ0FZQUFBQ3FhWEhlQUFBR0JVbEVRVlI0QWV5WXowOGtSUlRIZXhhRlVTRUVRamlRRUFnbitBK01ISmlERi84SkU0OWNTRkQ1RlRETUhFQVE5S3pSZytGSE5pSGVKRkZqQW5PQnJLekdZRlRRRzRSQUVHRloxdDBaRk1YdnAzZHIwcGxNTTkzTDdzeDAwNlJlcXZyVnE2cjMvYjczdW91NVpkM3d2NGlBRzU0QWxsc0d4RVFNYzA1QmgyZ3FQQTJBVGpRQVJGY2w1WXVTYWttTmhCNTVRV1Btc05NdytBMndCZ1dnZUFaNHpkblpXZkx5OGpLVHpXYS9QVGs1U1oyZW5xWmsrSkxFRUFJWjJMTk82bUEyQUJqUEFRS282dVBqNC9HNnVycGhKbXBxYXJvYkdob0c2K3ZyaDBUSS9hT2pJNGg0UlhPR0RBZ2pLOWlMUFRRVm5JYlRlSXZqakNFZzN0allPSUF5bFVwWnNWak1vdWNaYVdwcWVsZEVIR2N5bWE5RlZFcTZseVdRRWNnU0FiVDh0eHRSSkpweHBmOWROT2wwbXM1S0pwTTVJZ3daOFhqOE5ZZ1NHZmNPRHcrVGxJbU1JU091M3BEQi9wQXJWV1UySE1Rem5FUWdvZnJpNHNMV0p4SUo1bklDRVVnczlqZ3JEQm5OemMzdlVDWWk0MVFsa3RTQ3dKU0lEVlFPMHlBQXViVzB0UFE1aXA2ZUhycUNBaEZJTFBhWURHTVV0Qkp4RW5CcFFQVDI5djU0Y0hEd014bUFHTDFiN3lUQ1pJV1BFbkhidGlSNlF3RGdrZjkwNnIrU2kxZ3N4ck0xUGo2dVIyOE5JaEN0dFYrY2hvd0NKVkxvWGVIdGtHZHM1U1FBOEJmYS94L0orY0xDd3J4Nnkwc0dZSmN2RUlFWU1zejhreEk1MFZma202MnRyZGVsNTRYSnU4ZjRJbFhwbXZOUUNDRDZmK3Y0ODRHQmdZMzkvZjFmTkg1cUVsaUxPSWt3V1VHSmRIWjJmcm01dVZsV0V2SUp5R1dBSE0vT3pjMHRxdmRWQnRpN0NVUWd6cXpvNk9nWWtUMmZUajdCdklUMStQeGEvczVPQXFoNU1zQXVBUmxtUjBaRzdQc0FaWUJJOTh4YU9wMjI5NnF0clgxVkE2N1hYTUx3cDZRa2NLRE96elhLZ0N5Z0RMTFNadmthcUw5MkdaZzlJSEoxZGRWQzBHMXZiMytpbnVpWDVUMlFUNEF6Q3lBZ016OC92eUFIcmF2dUJNd1hFc0FpZ0hVS091eDFhZHJzNnVyNlZPT1NSbDNuNVpvYkFTWUx6b2VHaHU3eU1zUnBKTGZTWllDTkV5eGpkQWhMZG5kM2Z4c2RIWDEvWW1MaVBYMGUrNldqNUNnOXNvOEFTRlc2bGs4QUorT0lJY0RPQXIyMGJNZUszUW1TeWFTZDJvQkYyR3huWitmM3djSEJENGVIaHovUVBtKzJ0YldOVDA1TzNoa2JHMXZYL0FOSlJuSXVLUXNKaFFnQUxNNUFBbzVsRnhjWDUrU2c1L2ZBOHZMeVYvcU1maVRBYjdXM3Q2ZG1abWJ1VEU5UHIybVBJNGNjYTN3cStVdkNPV1FDNU91eGRLMFFBWnlPSXhDQVU5d0o3REpnSXBGSTBCVVVreUZyYTJzL3pjN09ic2pvUkFMb1EvVk9RY2ZjZmVrZlNpQUEwaUZmajZWcnhRZ3dYNE9Nbnp2QjFOU1VFL3dmZ29NQStrK05UZVRQTkFZOFpRYlJGVVVBa2NBaEhDTTZSZThFMUw4QVdTc3JLMStvcDdidnFTZktBS1luM1lrNGM2UzlxWDB5amJNNFUwdEsyOXd5QUM5TUdaZ3M4SFFuaU1mamtBWkloQ2pUQTVob0E1cUlReXAyQU9jY3ppdUxYRVVBRWNGQkhNWHBLKzhFcHY0M05qYStGNUpIRWdEVEF4ckFFTWxlN01uZWlNeksyN3dRUUlyaXZLYzdRWDkvUDlkbkFDT3NZejFScmdqQStYUmZSUUMyT0E0QWdOaFpvRStiRGNSRUhDTlQvK3ZyNjdmMWpDMlJaaDNyRWFrcnN4VWpBTENrTEdDSTZKVjNncXFxS213TkFZd3JHandoS1VZQU5vQ0FBS0thMVFVbjl6c0JrZWRlWUxKQjlmK0RGb1NXQUlCUkJvL01yMFVBNTY0djBCYnAzOWZYOTUzR1pBcUVrUUZra0ZUbGE4Vk85cElCZ0FDTW5RSGE4S0grUVJMZTlkdDdlM3UvNnRuaVgrYnU3dTdQTk9hdER3SFlzb2Jza2JweW14Y0M4QjRnZ0FJY0lCOEk4TWV0cmExdjY2WDRSa3RMUzUrTStPYno2U05Mc0dXTjFKWGR2Qkpnc2dBQ0FNbU5qcHNlVjF1RW14NDY1ckNoQkVKSkFKSGxZc1B0RGdLNDVpS015UUN5ZzNjRjZROXBsUjErZWVjMUEyUnFFVkVpQzBDQVFnS2dpVHc5MFNmOXNjR1dOUlV2ZmdnQURNQUFDQWxrQXFBaGc3RkovY0JFSDBCK0NXQ05JWUZ5Z0FpQTAwTk1vTUFENW1rSVlCMUNqZWNMK2tESmRRZ0lGRkEzWnlNQzNKaTVLZm9vQTI1S3BOMXdSaG5neHN4TjBZY3VBL3dHTGlMQUwyTmhzNDh5SUd3UjlZc255Z0MvaklYTlBzcUFzRVhVTDU0b0Evd3lGamI3S0FQQ0ZsRy9lS0lNOE10WTJPeWpEQWg2Uksvci8vOEFBQUQvLzltR1FIRUFBQUFHU1VSQlZBTUFFTFdobi9KQ0EzY0FBQUFBU1VWT1JLNUNZSUk9IiB3aWR0aD0iMzIiIGhlaWdodD0iMzIiLz48L3N2Zz4=) 4 4,auto;

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

  &__drawboard {
    position: relative;
    width: 100%;
    height: 100%;
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

<script setup lang="ts">
import type { Cursor, Element2D, PointerInputEvent } from 'modern-canvas'
import type { EditorComponent, Slots } from '../editor'
import { useResizeObserver } from '@vueuse/core'
import { Aabb2D } from 'modern-canvas'
import {
  computed,
  h,
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
  defaultDoubleclickStrategy,
  defaultHoverStrategy,
  defaultResizeStrategy,
  makeMceStrategyProps,
} from '../composables/strategy'
import { Editor } from '../editor'
import Floatbar from './Floatbar.vue'
import FloatPanel from './shared/FloatPanel.vue'
import Layout from './shared/Layout.vue'
import LayoutItem from './shared/LayoutItem.vue'
import Main from './shared/Main.vue'

const props = defineProps({
  ...makeMceStrategyProps({
    resizeStrategy: defaultResizeStrategy, // TODO
    activeStrategy: defaultActiveStrategy,
    doubleclickStrategy: defaultDoubleclickStrategy,
    hoverStrategy: defaultHoverStrategy,
  }),
  editor: Editor,
})

const slots = defineSlots<Slots & {
  'floatbar'?: () => void
  'floatbar-top'?: () => void
  'floatbar-bottom'?: () => void
  'drawboard'?: () => void
  'default'?: () => void
}>()

let editor: Editor
if (props.editor) {
  editor = props.editor
  provide(Editor.injectionKey, editor)
}
else {
  editor = useEditor()
}

editor.setup()

provide(IconsSymbol, createIcons())

const {
  sortedComponents,
  componentRefs,
  isElement,
  isFrameNode,
  drawboardDom,
  renderEngine,
  camera,
  bindRenderCanvas,
  hoverElement,
  state,
  setCursor,
  exec,
  isLock,
  t,
  selectionAabbInDrawboard,
  selectionMarquee,
  elementSelection,
  drawboardAabb,
  screenCenterOffset,
  activeTool,
} = editor

const overlayContainer = useTemplateRef('overlayContainerTpl')
const canvas = useTemplateRef('canvasTpl')
const grabbing = ref(false)

provideOverlay({
  attach: computed(() => overlayContainer.value),
})

useResizeObserver(canvas, (entries) => {
  const { width, height } = entries[0].contentRect
  renderEngine.value.resize(width, height)
})

onBeforeMount(() => {
  renderEngine.value.on('pointerdown', onEnginePointerDown)
  renderEngine.value.on('pointermove', onEnginePointerMove)
  renderEngine.value.on('pointerover', onEnginePointerOver)
})

onMounted(() => {
  bindRenderCanvas(canvas.value!, drawboardDom.value!)
})

onBeforeUnmount(() => {
  renderEngine.value.off('pointerdown', onEnginePointerDown)
  renderEngine.value.off('pointermove', onEnginePointerMove)
  renderEngine.value.off('pointerover', onEnginePointerOver)
})

function onHover(event: PointerInputEvent) {
  let cursor: Cursor | undefined
  let hovered: Element2D | undefined
  if (
    elementSelection.value.length > 1
    && selectionAabbInDrawboard.value.contains({
      x: event.clientX - drawboardAabb.value.left,
      y: event.clientY - drawboardAabb.value.top,
    })
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
    if (result && 'element' in result) {
      hovered = result.element
      cursor = result.cursor
    }
    else {
      hovered = result
    }
  }

  if (!(
    isElement(hovered)
    && !isLock(hovered)
    && !hovered.findAncestor(ancestor => isLock(ancestor))
    && (!hovered.children.some(node => isElement(node)) || !isFrameNode(hovered, true))
  )) {
    hovered = undefined
    cursor = undefined
  }

  hoverElement.value = hovered
  setCursor(cursor)
}

function onEnginePointerDown(
  downEvent: PointerInputEvent,
  options: Mce.PointerDownOptions = {},
): void {
  if (
    (
      downEvent.srcElement
      && downEvent.srcElement !== drawboardDom.value
      && (downEvent.srcElement as HTMLElement).dataset?.pointerdown_to_drawboard === undefined
    )
    || camera.value.spaceKey
    || ![0, 2].includes(downEvent.button)
  ) {
    return
  }

  const {
    allowTopFrame = false,
  } = options

  function isIncluded(node: any): node is Element2D {
    return isElement(node)
      && !isLock(node)
      && (allowTopFrame || (!node.children.some(node => isElement(node)) || !isFrameNode(node, true)))
      && !node.findAncestor(ancestor => isLock(ancestor))
  }

  const drawing = state.value === 'drawing'
  const hand = state.value === 'hand'
  const element = downEvent.target
  const start = { x: downEvent.clientX, y: downEvent.clientY }
  let current = { ...start }
  let prev = { ...current }
  let dragging = false
  let selecting = false
  let isUp = false
  let selected: Element2D[] = []
  let ctxState: Mce.State | undefined
  const inSelection = (allowTopFrame && elementSelection.value.some(node => node.equal(element)))
    || selectionAabbInDrawboard.value.contains({
      x: start.x - drawboardAabb.value.left,
      y: start.y - drawboardAabb.value.top,
    })

  if (downEvent.button === 2) {
    if (!inSelection) {
      const result = props.activeStrategy({
        element,
        event: downEvent,
        editor,
      })

      let _element = result && 'element' in result
        ? result.element
        : result

      if (!isIncluded(_element)) {
        _element = undefined
      }

      selected = _element ? [_element] : []
      elementSelection.value = selected
    }
    return
  }

  let drawingTool: any
  if (drawing) {
    drawingTool = activeTool.value?.handle?.(
      camera.value.toGlobal({
        x: current.x - drawboardAabb.value.left,
        y: current.y - drawboardAabb.value.top,
      }),
    )
  }
  else if (hand) {
    grabbing.value = true
  }

  function onDrag(event: PointerInputEvent): void {
    const result = props.activeStrategy({
      element,
      event,
      editor,
    })

    let _element: Element2D | undefined = result && 'element' in result
      ? result.element
      : result

    if (!isIncluded(_element)) {
      _element = undefined
    }

    selected = _element ? [_element] : []
    elementSelection.value = selected
  }

  function onSelectArea(): void {
    selecting = true
    if (state.value !== 'painting' && state.value !== 'selecting') {
      state.value = 'selecting'
    }
    selectionMarquee.value.x = Math.min(start.x, current.x) - drawboardAabb.value.left
    selectionMarquee.value.y = Math.min(start.y, current.y) - drawboardAabb.value.top
    selectionMarquee.value.width = Math.abs(start.x - current.x)
    selectionMarquee.value.height = Math.abs(start.y - current.y)
    exec('marqueeSelect')
    selected = elementSelection.value
  }

  function onActivate() {
    const result = props.activeStrategy({
      element,
      event: downEvent,
      editor,
    })

    let _element: Element2D | undefined
    if (result && 'element' in result) {
      _element = result.element
      ctxState = result.state
    }
    else {
      _element = result
    }

    if (!isIncluded(_element)) {
      _element = undefined
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
      && state.value !== 'painting'
      && (
        Math.abs(current.x - start.x) >= 3
        || Math.abs(current.y - start.y) >= 3
      )
  }

  function _onEnginePointerMove(moveEvent: PointerInputEvent) {
    if (drawing || hand) {
      //
    }
    else {
      if (inSelection) {
        if (canStartDrag()) {
          dragging = true
          exec('startTransform', downEvent)
        }
      }
      else {
        if (element) {
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
  }

  function _onPointerMove(moveEvent: PointerEvent) {
    current = { x: moveEvent.clientX, y: moveEvent.clientY }
    if (drawing) {
      drawingTool?.move?.(
        camera.value.toGlobal({
          x: current.x - drawboardAabb.value.left,
          y: current.y - drawboardAabb.value.top,
        }),
      )
    }
    else if (hand) {
      camera.value.position.add({
        x: Math.round(prev.x - current.x),
        y: Math.round(prev.y - current.y),
      })
    }
    else {
      if (!inSelection) {
        if (!isIncluded(element)) {
          onSelectArea()
        }
      }
    }
    prev = { ...current }
  }

  async function _onPointerUp(upEvent: PointerEvent) {
    current = { x: upEvent.clientX, y: upEvent.clientY }
    if (drawing) {
      drawingTool?.end?.(
        camera.value.toGlobal({
          x: current.x - drawboardAabb.value.left,
          y: current.y - drawboardAabb.value.top,
        }),
      )
    }
    else if (hand) {
      grabbing.value = false
    }
    else {
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

      if (state.value === 'painting' || state.value === 'selecting') {
        selectionMarquee.value = new Aabb2D({ x: -1, y: -1, width: 0, height: 0 })
      }
      if (state.value === 'painting') {
        exec('applyFormatPaint', selected)
        if (!(upEvent?.ctrlKey || upEvent?.shiftKey || upEvent?.metaKey)) {
          exec('exitFormatPaint')
        }
      }
      else if (state.value) {
        state.value = undefined
      }
    }

    renderEngine.value.off('pointermove', _onEnginePointerMove)
    document.removeEventListener('pointermove', _onPointerMove)
    document.removeEventListener('pointerup', _onPointerUp)
    isUp = true
  }

  renderEngine.value.on('pointermove', _onEnginePointerMove)
  document.addEventListener('pointermove', _onPointerMove)
  document.addEventListener('pointerup', _onPointerUp)
}

editor.registerCommand({ command: 'pointerDown', handle: onEnginePointerDown })

function onEnginePointerMove(event: PointerInputEvent): void {
  if (event.srcElement !== drawboardDom.value) {
    return
  }

  if (
    camera.value.grabbing
    || event.button === 1
    || (state.value && state.value !== 'typing')
  ) {
    return
  }

  onHover(event)
}

function onEnginePointerOver(event: PointerInputEvent): void {
  if (event.srcElement !== drawboardDom.value) {
    return
  }
  hoverElement.value = undefined
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
  props.doubleclickStrategy({
    event: event as any,
    editor,
  })
}

function setComponentRef(ref: any, item: EditorComponent) {
  if (!componentRefs[item.plugin]) {
    componentRefs[item.plugin] = []
  }
  componentRefs[item.plugin][item.indexInPlugin] = ref
}

function RenderComponent(props: Record<string, any> & { item: EditorComponent }) {
  const { item, ...resetProps } = props
  const itemSlots: Record<string, any> = {}
  if (item.slot) {
    Object.keys(slots).forEach((key) => {
      if (key === item.slot) {
        itemSlots.default = (slots as any)[key]
      }
      else if (key.startsWith(`${item.slot}.`)) {
        itemSlots[key.substring(`${item.slot}.`.length)] = (slots as any)[key]
      }
    })
  }
  return h(item.component, {
    ...resetProps,
    ref: (v: any) => setComponentRef(v, item),
  }, itemSlots)
}

const slotProps = {
  editor,
}
</script>

<template>
  <Layout
    class="mce-editor"
    :class="[
      state && `mce-editor--${state}`,
      activeTool && `mce-editor--drawing-tool-${activeTool.name}`,
      grabbing && `mce-editor--grabbing`,
    ]"
  >
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

        <Floatbar
          v-if="slots['floatbar-top'] || slots.floatbar"
          location="top-start"
          :target="state === 'typing'
            ? (componentRefs['mce:text']?.[0] as any)?.textEditor
            : (componentRefs['mce:selection']?.[0] as any)?.transform?.$el"
          :middlewares="['offset', 'shift']"
        >
          <slot name="floatbar" v-bind="slotProps" />
          <slot name="floatbar-top" v-bind="slotProps" />
        </Floatbar>

        <Floatbar
          v-if="slots['floatbar-bottom']"
          location="bottom-start"
          :target="(componentRefs['mce:selection']?.[0] as any)?.transform?.$el"
          :middlewares="['offset', 'shift']"
        >
          <slot name="floatbar-bottom" v-bind="slotProps" />
        </Floatbar>

        <slot name="drawboard" v-bind="slotProps" />
      </div>
    </Main>

    <slot v-bind="slotProps" />

    <template
      v-for="(item, key) in sortedComponents"
      :key="key"
    >
      <template v-if="item.type === 'overlay'">
        <Teleport
          v-if="drawboardDom && item.visible.value"
          :to="drawboardDom"
        >
          <RenderComponent
            :item="item"
          />
        </Teleport>
      </template>

      <template v-else-if="item.type === 'panel'">
        <template
          v-if="item.position === 'float'"
        >
          <FloatPanel
            v-if="drawboardAabb.height && item.visible.value"
            v-model="item.visible.value"
            :title="t(item.name)"
            :default-transform="{
              width: item.size || 240,
              height: drawboardAabb.height * .7,
              left: drawboardAabb.left + (screenCenterOffset.left + 24),
              top: drawboardAabb.top + (screenCenterOffset.top + 24),
            }"
          >
            <template #default="{ isActive }">
              <RenderComponent
                v-model:is-active="isActive.value"
                :item="item"
              />
            </template>
          </FloatPanel>
        </template>

        <template v-else>
          <LayoutItem
            v-if="item.visible.value"
            v-model="item.visible.value"
            :position="item.position as any"
            :size="item.size || 200"
            :order="item.order || 0"
          >
            <RenderComponent :item="item" />
          </LayoutItem>
        </template>
      </template>
    </template>

    <div
      ref="overlayContainerTpl"
      class="mce-overlay-container"
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
  flex-direction: column;
  background-color: rgb(var(--mce-theme-surface));
  color: rgb(var(--mce-theme-on-surface));
  overflow: hidden;
  user-select: none;
  cursor: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iMzJweCIgaGVpZ2h0PSIzMnB4Ij48aW1hZ2UgeGxpbms6aHJlZj0iZGF0YTppbWFnZS9wbmc7YmFzZTY0LGlWQk9SdzBLR2dvQUFBQU5TVWhFVWdBQUFFQUFBQUJBQ0FZQUFBQ3FhWEhlQUFBR0JVbEVRVlI0QWV5WXowOGtSUlRIZXhhRlVTRUVRamlRRUFnbitBK01ISmlERi84SkU0OWNTRkQ1RlRETUhFQVE5S3pSZytGSE5pSGVKRkZqQW5PQnJLekdZRlRRRzRSQUVHRloxdDBaRk1YdnAzZHIwcGxNTTkzTDdzeDAwNlJlcXZyVnE2cjMvYjczdW91NVpkM3d2NGlBRzU0QWxsc0d4RVFNYzA1QmgyZ3FQQTJBVGpRQVJGY2w1WXVTYWttTmhCNTVRV1Btc05NdytBMndCZ1dnZUFaNHpkblpXZkx5OGpLVHpXYS9QVGs1U1oyZW5xWmsrSkxFRUFJWjJMTk82bUEyQUJqUEFRS282dVBqNC9HNnVycGhKbXBxYXJvYkdob0c2K3ZyaDBUSS9hT2pJNGg0UlhPR0RBZ2pLOWlMUFRRVm5JYlRlSXZqakNFZzN0allPSUF5bFVwWnNWak1vdWNaYVdwcWVsZEVIR2N5bWE5RlZFcTZseVdRRWNnU0FiVDh0eHRSSkpweHBmOWROT2wwbXM1S0pwTTVJZ3daOFhqOE5ZZ1NHZmNPRHcrVGxJbU1JU091M3BEQi9wQXJWV1UySE1Rem5FUWdvZnJpNHNMV0p4SUo1bklDRVVnczlqZ3JEQm5OemMzdlVDWWk0MVFsa3RTQ3dKU0lEVlFPMHlBQXViVzB0UFE1aXA2ZUhycUNBaEZJTFBhWURHTVV0Qkp4RW5CcFFQVDI5djU0Y0hEd014bUFHTDFiN3lUQ1pJV1BFbkhidGlSNlF3RGdrZjkwNnIrU2kxZ3N4ck0xUGo2dVIyOE5JaEN0dFYrY2hvd0NKVkxvWGVIdGtHZHM1U1FBOEJmYS94L0orY0xDd3J4Nnkwc0dZSmN2RUlFWU1zejhreEk1MFZma202MnRyZGVsNTRYSnU4ZjRJbFhwbXZOUUNDRDZmK3Y0ODRHQmdZMzkvZjFmTkg1cUVsaUxPSWt3V1VHSmRIWjJmcm01dVZsV0V2SUp5R1dBSE0vT3pjMHRxdmRWQnRpN0NVUWd6cXpvNk9nWWtUMmZUajdCdklUMStQeGEvczVPQXFoNU1zQXVBUmxtUjBaRzdQc0FaWUJJOTh4YU9wMjI5NnF0clgxVkE2N1hYTUx3cDZRa2NLRE96elhLZ0N5Z0RMTFNadmthcUw5MkdaZzlJSEoxZGRWQzBHMXZiMytpbnVpWDVUMlFUNEF6Q3lBZ016OC92eUFIcmF2dUJNd1hFc0FpZ0hVS091eDFhZHJzNnVyNlZPT1NSbDNuNVpvYkFTWUx6b2VHaHU3eU1zUnBKTGZTWllDTkV5eGpkQWhMZG5kM2Z4c2RIWDEvWW1MaVBYMGUrNldqNUNnOXNvOEFTRlc2bGs4QUorT0lJY0RPQXIyMGJNZUszUW1TeWFTZDJvQkYyR3huWitmM3djSEJENGVIaHovUVBtKzJ0YldOVDA1TzNoa2JHMXZYL0FOSlJuSXVLUXNKaFFnQUxNNUFBbzVsRnhjWDUrU2c1L2ZBOHZMeVYvcU1maVRBYjdXM3Q2ZG1abWJ1VEU5UHIybVBJNGNjYTN3cStVdkNPV1FDNU91eGRLMFFBWnlPSXhDQVU5d0o3REpnSXBGSTBCVVVreUZyYTJzL3pjN09ic2pvUkFMb1EvVk9RY2ZjZmVrZlNpQUEwaUZmajZWcnhRZ3dYNE9Nbnp2QjFOU1VFL3dmZ29NQStrK05UZVRQTkFZOFpRYlJGVVVBa2NBaEhDTTZSZThFMUw4QVdTc3JLMStvcDdidnFTZktBS1luM1lrNGM2UzlxWDB5amJNNFUwdEsyOXd5QUM5TUdaZ3M4SFFuaU1mamtBWkloQ2pUQTVob0E1cUlReXAyQU9jY3ppdUxYRVVBRWNGQkhNWHBLKzhFcHY0M05qYStGNUpIRWdEVEF4ckFFTWxlN01uZWlNeksyN3dRUUlyaXZLYzdRWDkvUDlkbkFDT3NZejFScmdqQStYUmZSUUMyT0E0QWdOaFpvRStiRGNSRUhDTlQvK3ZyNjdmMWpDMlJaaDNyRWFrcnN4VWpBTENrTEdDSTZKVjNncXFxS213TkFZd3JHandoS1VZQU5vQ0FBS0thMVFVbjl6c0JrZWRlWUxKQjlmK0RGb1NXQUlCUkJvL01yMFVBNTY0djBCYnAzOWZYOTUzR1pBcUVrUUZra0ZUbGE4Vk85cElCZ0FDTW5RSGE4S0grUVJMZTlkdDdlM3UvNnRuaVgrYnU3dTdQTk9hdER3SFlzb2Jza2JweW14Y0M4QjRnZ0FJY0lCOEk4TWV0cmExdjY2WDRSa3RMUzUrTStPYno2U05Mc0dXTjFKWGR2Qkpnc2dBQ0FNbU5qcHNlVjF1RW14NDY1ckNoQkVKSkFKSGxZc1B0RGdLNDVpS015UUN5ZzNjRjZROXBsUjErZWVjMUEyUnFFVkVpQzBDQVFnS2dpVHc5MFNmOXNjR1dOUlV2ZmdnQURNQUFDQWxrQXFBaGc3RkovY0JFSDBCK0NXQ05JWUZ5Z0FpQTAwTk1vTUFENW1rSVlCMUNqZWNMK2tESmRRZ0lGRkEzWnlNQzNKaTVLZm9vQTI1S3BOMXdSaG5neHN4TjBZY3VBL3dHTGlMQUwyTmhzNDh5SUd3UjlZc255Z0MvaklYTlBzcUFzRVhVTDU0b0Evd3lGamI3S0FQQ0ZsRy9lS0lNOE10WTJPeWpEQWg2Uksvci8vOEFBQUQvLzltR1FIRUFBQUFHU1VSQlZBTUFFTFdobi9KQ0EzY0FBQUFBU1VWT1JLNUNZSUk9IiB3aWR0aD0iMzIiIGhlaWdodD0iMzIiLz48L3N2Zz4=) 4 4,auto;

  &--hand {
    cursor: grab;
  }

  &--grabbing {
    cursor: grabbing;
  }

  &--drawing {
    cursor: crosshair;
  }

  &--drawing-tool-pencil {
    cursor: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iMzJweCIgaGVpZ2h0PSIzMnB4Ij48aW1hZ2UgeGxpbms6aHJlZj0iZGF0YTppbWFnZS9wbmc7YmFzZTY0LGlWQk9SdzBLR2dvQUFBQU5TVWhFVWdBQUFFQUFBQUJBQ0FZQUFBQ3FhWEhlQUFBRjIwbEVRVlI0QWV5Wlcyc2tSUmlHZXp6TlNFaitRa2l1Y3BPcklJYUVrQWxtL29NSWFuNUJiZ0tpNURpYmcvOUJCQVVEQmc4b2lCZENJQWZJUVFrSzNnUXZjcE9BaDNnZWRZMmJkYlB2MDB3dHZaUHQ2YXFlVHJxejAwTzlWSFhYVjFYZis5WlgxZDAxVDNodC9zc0ZhUE1BOFBJSXlDT2d6UlhJbDBDYkIwQytDZVpMSUY4Q2JhNUF2Z1F5RkFBRitjS0VQS244YWVHWk9paHpqenBzZER1NVJLZko5UmEvSi95QUpLUkxSMGRIbFZxdFZnV1UxVzFKb0E0YmJIV1pURXEwczVndVFlb3B0UzBlSGg2T241MmRmZEhiMi90NVoyZm42NEF5OTZqRFJzQ1dOaXE2cDhZV2FRc0FFUWlWRGc0T0tuMTlmWjhWaThYaHpjMU5yMXF0K3NCaDdsR0hqYTZKQnRyUVZwZXRwVFFGZ0FCRVNudDdlK01EQXdPZlFBWGlZMk5qM3NMQ2dvOUNvZkJBQ0d5d2xWMWlJcVFsd0FQeTI5dmJsY0hCd1k5RnlpZTZJT0tVeStXeVo4cmtDT1BwaHkxdFZFeEVoRFFFZUlqOHlNakloeUx6RUhrSWIyeHNlUFB6ODQ4VWdUWkppWERkQWxpUmh6aWlBTW9JUXBuY1JBSWk3T3pzak91K2lZUllYR0kxMHFCeGtqTjVNMGlZQ0VORFF4OXBUM2hCZGtXQi9jU1pqM01ERFJRbnhTWnZCZ3NUb2IrLy96WFpFQVc4TURuemNXNmd3VnhUeStUTmdJMGk4TGpzNk9oNGZuMTlmVXcyc1Y2VXJscUFTUEp5M0lNSXVRMFFvVnd1KzZaYlcxdCszdFBUTTZJQ0FyQU1DaXBicDZzVUlKSThteHBrRUlCbnY2M1h0QW5hbnArZk14WkxnTnlKazVOeGNOQ0lNbzR3R3lVZVYrelkyRmYxZGdkcHl1VE1Kbzg3Q05tS0VPeUQ5dlMxdjcvL2pYTEdkT2JqM0VBRFJTVWNzU0p2T3JJVklVZ2VBV2wvZW5yNjdjVEV4TmVVNHlCcEFaekpHNmVqUkdna2IyWi9kWFgxUGZWeFYvaGZ1Q2M0cFNRRmlFM2VlQndtUWhqNTVlWGwyYW1wcVMvVi9qL2hYSEFXSVNrQldpWXY1LzNVS0VJWWVTMkJXek16TTVEL1J3My9GZTRJUk1LRmN1dVVoQUNKa1RkZUIwVVFVZjgydVFuN3VibTVKUW16cjRxYThKZHdXMENBU3hHZyswMVRxd0lrVHQ1NHk1UEJsSVBrWjJkbmx4Y1hGL2RVOTRmd3AvQzNjQ2F3Qks1MUQ3Z3k4cHBkRDlJaTVlZG01aUcvdExSa3lDTUFFY0Rzc3djUS90Y21RSnJrZjVjd0FQS3NmMlkvRm5uMUUrdXZzYXlRTjZFUGVkWStmSnpodWdjOFZ1UlJ5MFVBYlAwM1BBNGltcjNlMHJFTExOWThJUThJKzBSbTN2Z0hLVk51bG1NSCtTSUhFQnhFWUJ6bU9IVzJDT3Nqc09GQkhDUk9IaDhoUnQ0TWZGNFMrbnh1UGxzL2dMaDBobWQyNm1ZZE5kYWxUUjUvYkFUQXhwLzlrNU9UTnppQTRNdnRVWThwT3JSRkZzampLK1RJbXdFYlg0Q3VycTRoRE0xQkJDTGMxSm1IQjRBY2VSZ0lmMnc0YkNoS2dPY3doRGo1VFNjUEI4aVJod0VCV1A5K0JJUVoyZDdQU3RnSC9iVVJBQnNqUXJDdFV6bUw1Q0VBT2ZKbU1GR0FDTTNzUXV1eVNoNkhvd1NBdkVHVUxmMWRRcGJKNDJ3c1VqUzBRUnJrYmZ3SzJ0Z0l3QW1MRHc0Z2FXeSsxU0hJZFNONFQrQ1kyend0eU0wVDQ3cmU4QnA5Q3J1T0VzQW5yc1o4Wjk4ckZBcGNlMFlBaU9tZTF3aklJNExhaFgzUDgyb0xydVQxbG5GdDRTTEEzYlcxdFhmcG1ObUVQT1V3SUJKSFc5aGl3ekdXRGpOMlZZWTRTSjI4ZkxFNkQyRDIrZWErTXprNStkWHU3dTc3TklUWXhjV0ZGd2JJSThMeDhmRjNFdXVXanJFeVJ4NGVOaEhBWVFNQ2NPeDBlM2g0K0czOTIvT0IvcEQ4bEE3Q0FQSHA2ZWszdTd1N3A3Vlg3TWp1TnlFek15OWYvR1FqQUJIQWdTTkhUM3lMMTBaSFI5K3FWQ3J2YU8yL0tMd3N2Q3BNMVBHSzhwY2d2ckt5QXZGZk5SSkFnT0FoSnFJaXJxclRTMUVDNEprUmdBaEFBQTRqSWZTTEtuK3Vnekl3MXlZL3JkY2I4c0V6dk5USnl6ZnJQUUJuT1hmbkJKYk5DMEtRL0VtZC9DaDhYOGNQeWdIM3FFTVViSm41ekpHWHIxWUNZQmVNQW9nZ1FqQVNJQm9FRWNKNng0YW9RVGdpS0JOaER5RURteVdBTGMvL29BajhGUVV4L3BWQkRNQXNBOHFBT29oalMvUVFSZlJCZjVtQnJRQTRiRVJnRmlIRWpMSXhRcklSM0tjZU8rd2hUbnY2eVJSY0JBZzZEaGxJTWFzQWtnWmNBK3F4QzdiTFhEbXVBSmtqRXRlaFhJQzR5ajB1N1c1OEJMUTZFZmNCQUFELy83YmpxNjRBQUFBR1NVUkJWQU1BTUpYNHJsQ2FESTRBQUFBQVNVVk9SSzVDWUlJPSIgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIi8+PC9zdmc+)8 24,auto;
  }

  &--drawing-tool-pen {
    cursor: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iMzJweCIgaGVpZ2h0PSIzMnB4Ij48aW1hZ2UgeGxpbms6aHJlZj0iZGF0YTppbWFnZS9wbmc7YmFzZTY0LGlWQk9SdzBLR2dvQUFBQU5TVWhFVWdBQUFFQUFBQUJBQ0FZQUFBQ3FhWEhlQUFBSmRFbEVRVlI0QWV5WlMyeFZWUlNHejZrZ0JVSjRoUEFJanhBU0VoSkN3a0NOK0lCTEFJR3hUdFNKRTRkZ1JDdFdvYjBGQnpoaWJnSWl3a0FuQ2tnQ0RZUkNERGFvQTJPMXBqTVNIcTJsRHdxMXBVLy9iOU5WZGsvUGZmYmVpOVNTdmJwZmE2Kzkvbit0dmMvaDNMTGdmLzV2aW9Bc0V5Q1VIbVE5bzNxYUovUVoxOURUV1RJNUQzQkFBdnBaUVN5WHpCd1Iyc2dNOVptYnJocGRiTEpPM2Y5K3dkbFVYZ0tDZVFlK3FhbHBhMjl2NzRYaDRlRXVwTFcxdGJxdHJhMjZvYUZobXd4QVNwU01wNElRQU1yL2NRWHdSQk1RNVFLYlhMTm16UTh6WnN4NDJUUVhMbHo0NFlJRkN5cldyVnQzUm9SMDl2VDBuSmRlVFh0N2U0MUkyU0c5V1NNU0pRYTdxZmJWa3RLV09FZDg4RFB2M0xsVEJWamNxcW1wQ2JaczJSS0VZUmpRUnVycTZwZ0t5c3ZMWDBKdi92ejVIOFdSMHRqWStKb1VMVk00TW9pUndaNmFMbjJKRW9BampMbkkzNzU5KzhDU0pVdjI0aFpnazhsa1lJQnBJMFlJTlRxSTZmaWtyRjI3OXF3eTVaNHlwWllza1UweWhPeDRva1FBVnI2TUZnaHdaMTZSMzc5MDZkTDNtUUVVWUdsZnZudzVRT2dqaVVTQzRRRFE5QkhJQ01QUVpRdHJFYWVrUDVBeVgxa2lNanAwWkpLZG5aMUpEWk1aUGhFYUtrMkpFa0RmUlgvMjdObXY0QUxPQTRvMmN1WEtsU0NSU0FUVjFkVk9JRU5neHBDQ0h1S1RFb2JobUtQRFBFZG03dHk1KzFwYVdxclZKeU40b2hBQWprYW9zYUlYQU5zbWJNakdqb0E1YythOHdJU0I5K3NhM1FYTStlS1RBaUVJNUxBT01WM2FTQmcrdWtjWVg3Um8wUWZTYnlNajFPZFk0QU8rNEpPR2lsZWlCTkFuQWtRaUlJSnNuVWdrWExSeG5ENTFIQW5NK1dMcnlCWUJEQkRXbWc3dE1IeE1CQm1oYktqU2ZNbElBTEQyY3dXMjZjTThFWENwem93UkFSQ2Nab3c2R3hMUTlRVWJSZ1EybUtNMlcyU0Q3cDhER29jRWdvRlA2aGFuUkkwYkNXVkt4OS9Za2loU0Y1SUU3RUVFQW5qNjFFWUNUNTZyVjY5dTFUaVpXRlFTb2dSb1QxY2d3alhpL3FSeVBFNDMwMWdxV3hzMmJLalEybGtTZXpxazlVbDZlWlVvQWNPeWdneWRPblhxaE5ydTdGTmJkR2dqcVJ4bkxsZUoyaUxidUlSdjNManhzV3dWTkF0a2IwenhDUUE0TWlTTndXblRwZzJxVGx1aWprZEpTcnM0TXVuYk1qc3JWNjdjSXpYL0hhSGdXUkFsd0lIWHBnTzdkKy8rVmZXNGk1QXhYM3pIL1hQczYyVGJ4aGE2WkFCQysvVHAwNXRWRnkwTFVoRkE5UHVibTV0LzErWTVrNER6Q0crRVNCZytmaXZFWGpxQlJPWXRDelp0MnZTZStpVWhRUHNFZGdRRzFPa3ZLeXVqcjJibVF2VE1lVUFqa0lDd21wcDVHMmNzVHJERE9QclU4K2JOZSs3Y3VYT3ZxczJqbVVkMFFZK0Jud0hhSTdBalFBWU1uRHg1OG1zR3pTbUxDbU54Z3A0OU5wa0hNRytEOXR4bkRtQ1o3S0RIZW5TcHU3dTdlUklnQlg4a1Jna2c0cEJBQmd4TW56NmRHaCt5Rm5NYThENGh0Q0VEY09nZ3FZeWk0OCt0WDcvK1JmVXRBNkkrYXlyL0VqVm1CTGdNMkxObnp5K1lOb2ZTT1kyZVJkYkFNeFlWaUdETWRHbEhaZk5tN3IzQWZYTmdidkhpeGMrckp2b2NBWHd1MkRIQW1HeVBsakVFYURUcmkxQzZXWlZzeWZTTkRRME5BZGpQQVBxK1N0N3RLQUVZTWhKSS81d3VRaFlqRmtIYStZaVJaR3QxaHdDWU84QklvRy9URTZyakNPQU80QWdnNHk1Q3ZnZWsydEdBcDB0dk8wWlJrTDVOMDZGRzlML0VEUjBkSGNla1UzQVM0Z2p3TTJEY1JZaERjaVMyR0NoMGtEZ2xJOGQwNDNTWTR4NWh6aDZiUEE2N3VycSswWmlSRU9lN3BuTXJjVWFNQURLZ1h4Zmh6NWpFS1dxQUliVGp4SGZjd0tMSEdnT0RMYnNNbVlzVDVuMWJySitqanpRWEwxNU1TSitqd0tVWTU3K21zeTl4Qm53QzNEMFFmU05NZHd4OHh3RVFocUg3RkpZTGVIUGZ0MlY3cmw2OW1rOTFaQUZQaE5CMDg2M2pDTUNXM1FNUTBCZDlJU0lhS0tVU2N4d0NUSWVvOHg2QTBMYnhYT3Urdmo0aUR3SFVxZnpQMm13cUEyU0JPd0t5MUZkUlVUSDZQb0R6RUlCb0xtV0JCRVEzdVBzVWxnOXdqcENSaUMwMkd4d2N4R2VMZnRFem9GK2I5a2tlNmpOVmcrckFITEdVWnF3WTRvT0hQUGFvcjY4L3BSOWR2cUNkcldUU2c4MDRIY3NBZHdTazBHc2ZTTWdBUkdPamIycTBDeWxSOE95bkgybisyTGh4NDNIdFExRElUbnhFTkpSL1NVVUFGcmtISU9DaE9qMDZCdGYxbmU1YnRkMXZBRGhWVjFmbmZ2eGdyRkFTQi83V3JWdU55NVl0cTlRZTNaSmVDVm1KYi9pb2J2NGxHd0xZckVkYlBOQ0x6cGMzYjk3OFUrMHhKT0EwWkRBK0VjRk9NcGwwSmtoN1NOWitmeTFmdnZ4VERYWkpIa2ora1JBVXl3SjE4eS9wQ0NDOTJNUUlnUDM3SzFhc3FDUWliR24zQVU1ekp3Q0E4WHlFdGRoaHJROWUrKzNYMkwwUnVhK2FZT0FUR1lDUEdzcS9wQ01BcTZRWUc1RjJFRUFVN2hFUklrT0V1T1hOY2Vvd2ZQUkRCNEN5elFwMFdjdUdFZkQ4UHRDcGNRUVN5QUI4NFI3QXQ1SVJBT05HQU01MEtqS2Y2SzNzZXpubm5neFJJZ0JFVm9SaDZGNkV3dkFSTWVqNzRvTm5EYVF5Zi9Ub1VWNTczVjdxVXdQZW9rOW1UaGk4N0FhWk1nQWRtSVp4bURjU09qVFJzWDM3OXE4dVhicjBuZHF1Y0NTTUNCK01tOVFmeGdDc3BpdTBHYU5EemZxUjlrSDFyNmtOY0FUd25IMENRVVlXQkx6c1owVUFtOEU0SkJBQnppRk90Y3RBMjdadDI0NkZZZmpXaFFzWHpxanZDa0FRMGhsQ0VOcE1DcGg3ZktZQ3IzV0hOUGVUZE5uRDByNG80TFZIVmdTZ0J3a3dUd1RHa1NDRnRwMDdkeDRYRVcvWDF0YWVQbi8rL0ZuOXFOR2s4ZEZDYXZza1FBU1QxQUpOTTZpcXF2cnM0TUdEOWVvWWVNZzI4QVFCUHpSZHVKTE5FYkRkMkJ3U2VBVDVKTFJKb1hWRTd1N1lzZVBZcmwyN1RxeGF0YXBHaEx3amVYZnYzcjFITk84K3J3TTRrVWk0Tm9UNDRBOGRPZ1I0amhjRWNPRUNudjNZbDZPSW1ZSktMZ1N3TVNRUWlXZ21HQWwvUzhtWHUrcTNIVGx5NUhwbFplWG5hcnNMRStCSVFrUXdSdVFGbnJRdktYajJ6cFVBMWhnSjNBblJpeEhBRU5BaVJhUjVwRzQ5ZlBqd05XWERtL2JrMEhqQW8xVG52VWJndWZBQWp4QjVMbHRzRnkzeTdJL2tRd0RyZkJKSVVZNEVOelhPazc0QUlTc2dCQms5SW5weWNHbStMakxlMEtOMG40N0VqektJTG10WWp4MERUN1pwdW5nbFh3TE1JNGdnU2h3Skk0TG9jWGtCaGxzY1lEd3hqQWd5eEJmR21VZTNwT0FCTVZFQ3NJRkFCTkhpV0VUSkFCUmtrQmxFbW13d0FtZ3o5a1RBNDNpaENNQ1dDV1J3WXhzaGxoaytFWllWa0FJNVpBMTZaQlByekZiT2RhNExpa0ZBMUFmSUFCaVp3VjBCV01oQWFEUEdIRG9sQlkranBTQ0FmY2dLd0FFU3NFUWJvYzJ4WVJ5aTBDMnBsSW9BQXdVUkNHQk42TnQ4eWV0U0UxQnlnSmsybkNJZ0UwT1RmWDRxQXlaN2hEUGhtOHFBVEF4Tjl2bXBESmpzRWM2RWJ5b0RNakUwMmVlbk11QnBqL0JFL2Y4WEFBRC8vemM3eStFQUFBQUdTVVJCVkFNQUg2M2h2WjBON3dnQUFBQUFTVVZPUks1Q1lJST0iIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIvPjwvc3ZnPg==)4 4,auto
  }

  * {
    box-sizing: border-box;
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

.mce-overlay-container {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>

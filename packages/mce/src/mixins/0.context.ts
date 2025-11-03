import type { Cursor, Node, Vector2Data } from 'modern-canvas'
import type { ComputedRef, Ref } from 'vue'
import type { Doc } from '../models'
import type { AxisAlignedBoundingBox } from '../types'
import { Camera2D, DrawboardEffect, Engine, Timeline } from 'modern-canvas'
import { Fonts } from 'modern-font'
import { computed, markRaw, ref } from 'vue'
import { defineMixin } from '../editor'

declare global {
  namespace Mce {
    interface Editor {
      fonts: Fonts
      renderEngine: Ref<Engine>
      timeline: Ref<Timeline>
      camera: Ref<Camera2D>
      drawboardEffect: Ref<DrawboardEffect>
      setCursor: (mode: Cursor | undefined) => void
      drawboardDom: Ref<HTMLElement | undefined>
      drawboardAabb: Ref<AxisAlignedBoundingBox>
      drawboardPointer: Ref<Vector2Data | undefined>
      root: ComputedRef<Node | undefined>
      doc: Ref<Doc | undefined>
      state: Ref<State | undefined>
      setState: (state: State, context?: StateContext) => void
      stateContext: Ref<StateContext | undefined>
      getGlobalPointer: () => Vector2Data
    }

    interface Events {
      setState: [state: State]
    }
  }
}

export default defineMixin((editor) => {
  const {
    emit,
  } = editor

  const fonts = markRaw(new Fonts()) as Fonts
  const timeline = ref(new Timeline({ startTime: 0, endTime: 0, loop: true, paused: true }))
  const _renderEngine = new Engine({
    pixelRatio: 2,
    fonts,
    timeline: timeline.value as any,
    fps: 0,
    speed: 0,
  })
  markRaw(_renderEngine.renderer)

  const camera = ref(new Camera2D({ internalMode: 'front' }))
  const drawboardEffect = ref(new DrawboardEffect({ internalMode: 'back', effectMode: 'before' }))
  _renderEngine.root.append(camera.value as any)
  _renderEngine.root.append(drawboardEffect.value as any)
  const renderEngine = ref(_renderEngine)
  renderEngine.value.start()

  const drawboardDom = ref<HTMLElement>()
  const drawboardAabb = ref({ left: 0, top: 0, width: 0, height: 0 })
  const doc = ref<Doc>()
  const root = computed(() => doc.value?.root)
  const drawboardPointer = ref<Vector2Data>()
  const state = ref<Mce.State>()
  const stateContext = ref<Mce.StateContext>()

  function setState(value: Mce.State, context?: Mce.StateContext): void {
    state.value = value
    stateContext.value = context
    switch (value) {
      case 'drawing':
        setCursor('crosshair')
        break
    }
    emit('setState', value)
  }

  function setCursor(mode: Cursor | undefined): void {
    renderEngine.value.input.setCursor(mode)
  }

  function getGlobalPointer(): Vector2Data {
    const { x = 0, y = 0 } = drawboardPointer.value ?? {}
    return camera.value.toGlobal({
      x: x - drawboardAabb.value.left,
      y: y - drawboardAabb.value.top,
    }, { x: 0, y: 0 })
  }

  Object.assign(editor, {
    fonts,
    renderEngine,
    timeline,
    camera,
    drawboardEffect,
    root,
    drawboardDom,
    drawboardAabb,
    doc,
    state,
    stateContext,
    setState,
    setCursor,
    drawboardPointer,
    getGlobalPointer,
  })
})

import type { Cursor, Node } from 'modern-canvas'
import type { ComputedRef, Ref } from 'vue'
import type { Doc, Workspace } from '../models'
import type { AxisAlignedBoundingBox } from '../types'
import { Camera2D, Engine } from 'modern-canvas'
import { Fonts } from 'modern-font'
import { computed, markRaw, ref } from 'vue'
import { definePlugin } from '../editor'

declare global {
  namespace Mce {
    interface Editor {
      fonts: Fonts
      renderEngine: Ref<Engine>
      camera: Ref<Camera2D>
      setCursor: (mode: Cursor | undefined) => void
      drawboardDom: Ref<HTMLElement | undefined>
      drawboardAabb: Ref<AxisAlignedBoundingBox>
      workspace: Ref<Workspace | undefined>
      root: ComputedRef<Node | undefined>
      docMeta: ComputedRef<{ title: string }>
      doc: Ref<Doc | undefined>
      state: Ref<State | undefined>
      setState: (state: State, context?: StateContext) => void
      stateContext: Ref<StateContext | undefined>
    }

    interface Events {
      setState: [state: State]
    }
  }
}

export default definePlugin((editor) => {
  const {
    provideProperties,
    emit,
  } = editor

  const fonts = markRaw(new Fonts()) as Fonts
  const _renderEngine = new Engine({
    pixelRatio: 2,
    fonts,
    msaa: true,
    antialias: true,
    autoStart: true,
  })
  markRaw(_renderEngine.renderer)
  const renderEngine = ref(_renderEngine)
  const camera = ref(new Camera2D({ internalMode: 'front' }))
  _renderEngine.root.append(camera.value as any)

  const drawboardDom = ref<HTMLElement>()
  const drawboardAabb = ref({ left: 0, top: 0, width: 0, height: 0 })
  const workspace = ref<Workspace>()
  const doc = ref<Doc>()
  const root = computed(() => doc.value?.root)
  const docMeta = computed(() => root.value?.meta ?? {})
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

  provideProperties({
    fonts,
    renderEngine,
    camera,
    root,
    drawboardDom,
    drawboardAabb,
    workspace,
    docMeta,
    doc,
    state,
    stateContext,
    setState,
    setCursor,
  })
})

import type { Cursor, Node } from 'modern-canvas'
import type { ComputedRef, Ref } from 'vue'
import type { DocModel, WorkspaceModel } from '../models'
import type { AxisAlignedBoundingBox } from '../types'
import { Camera2D, Engine } from 'modern-canvas'
import { Fonts } from 'modern-font'
import { computed, markRaw, ref } from 'vue'
import { defineProvider } from '../editor'

declare global {
  namespace Mce {
    interface Editor {
      fonts: Fonts
      renderEngine: Ref<Engine>
      camera: Ref<Camera2D>
      setCursor: (mode: Cursor | undefined) => void
      drawboardDom: Ref<HTMLElement | undefined>
      drawboardAabb: Ref<AxisAlignedBoundingBox>
      workspace: Ref<WorkspaceModel | undefined>
      root: ComputedRef<Node | undefined>
      docMeta: ComputedRef<{ title: string }>
      docModel: Ref<DocModel | undefined>
      status: Ref<Status | undefined>
      setStatus: (status: Status, context?: StatusContext) => void
      statusContext: Ref<StatusContext | undefined>
    }

    interface Events {
      setStatus: [status: Status]
    }
  }
}

export default defineProvider((editor) => {
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
  const workspace = ref<WorkspaceModel>()
  const docModel = ref<DocModel>()
  const root = computed(() => docModel.value?.root)
  const docMeta = computed(() => root.value?.meta ?? {})
  const status = ref<Mce.Status>()
  const statusContext = ref<Mce.StatusContext>()

  function setStatus(value: Mce.Status, context?: Mce.StatusContext): void {
    status.value = value
    statusContext.value = context
    switch (value) {
      case 'drawing':
        setCursor('crosshair')
        break
    }
    emit('setStatus', value)
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
    docModel,
    status,
    statusContext,
    setStatus,
    setCursor,
  })
})

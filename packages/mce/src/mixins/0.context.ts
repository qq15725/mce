import type { Cursor, Vector2Like } from 'modern-canvas'
import type { IndexCharacter } from 'modern-text/web-components'
import type { ComputedRef, Ref } from 'vue'
import type { AxisAlignedBoundingBox } from '../types'
import { Camera2D, DrawboardEffect, Element2D, Engine, Node, Timeline } from 'modern-canvas'
import { Fonts } from 'modern-font'
import { computed, markRaw, reactive, ref, watch } from 'vue'
import { defineMixin } from '../mixin'
import { Doc } from '../models'

declare global {
  namespace Mce {
    type Tblock = 'top' | 'bottom'

    type Tinline = 'start' | 'end' | 'left' | 'right'

    type Anchor
      = | Tblock
        | Tinline
        | 'center'
        | 'center center'
        | `${Tblock} ${Tinline | 'center'}`
        | `${Tinline} ${Tblock | 'center'}`

    type ParsedAnchor
      = | { side: 'center', align: 'center' }
        | { side: Tblock, align: 'left' | 'right' | 'center' }
        | { side: 'left' | 'right', align: Tblock | 'center' }

    interface Editor {
      fonts: Fonts
      renderEngine: Ref<Engine>
      timeline: Ref<Timeline>
      camera: Ref<Camera2D>
      drawboardEffect: Ref<DrawboardEffect>
      setCursor: (mode: Cursor | undefined) => void
      drawboardDom: Ref<HTMLElement | undefined>
      drawboardAabb: Ref<AxisAlignedBoundingBox>
      drawboardPointer: Ref<Vector2Like | undefined>
      drawboardContextMenuPointer: Ref<Vector2Like | undefined>
      doc: Ref<Doc>
      root: ComputedRef<Node>
      nodes: Ref<Node[]>
      nodeIndexMap: Map<string, number>
      selection: Ref<Node[]>
      elementSelection: Ref<Element2D[]>
      textSelection: Ref<IndexCharacter[] | undefined>
      hoverElement: Ref<Element2D | undefined>
      state: Ref<State | undefined>
      getGlobalPointer: () => Vector2Like
      parseAnchor: (anchor: Anchor, isRtl?: boolean) => ParsedAnchor
      isNode: (value: any) => value is Node
      isRoot: (value: any) => value is Node
      isElement: (value: any) => value is Element2D
      isFrame: (value: any) => value is Element2D
      isVisible: (node: Node) => boolean
      setVisible: (node: Node, visible: boolean) => void
      isLock: (node: Node) => boolean
      setLock: (node: Node, lock: boolean) => void
    }
  }
}

export default defineMixin((editor) => {
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
  const drawboardPointer = ref<Vector2Like>()
  const drawboardContextMenuPointer = ref<Vector2Like>()
  const doc = ref(new Doc())
  const root = computed(() => doc.value.root)
  const nodes = ref<Node[]>([])
  const nodeIndexMap = reactive(new Map<string, number>())
  const selection = ref<Element2D[]>([])
  const elementSelection = computed({
    get: () => selection.value.filter(v => isElement(v)),
    set: val => selection.value = val,
  })
  const textSelection = ref<any[]>()
  const hoverElement = ref<Element2D>()
  const state = ref<Mce.State>()

  function setCursor(mode: Cursor | undefined): void {
    renderEngine.value.input.setCursor(mode)
  }

  function getGlobalPointer(): Vector2Like {
    const { x = 0, y = 0 } = drawboardPointer.value ?? {}
    return camera.value.toGlobal({ x, y }, { x: 0, y: 0 })
  }

  const block = ['top', 'bottom']
  const inline = ['start', 'end', 'left', 'right']

  function toPhysical(str: 'center' | Mce.Tblock | Mce.Tinline, isRtl?: boolean): 'bottom' | 'center' | 'left' | 'right' | 'top' {
    if (str === 'start')
      return isRtl ? 'right' : 'left'
    if (str === 'end')
      return isRtl ? 'left' : 'right'
    return str
  }

  const parseAnchor: Mce.Editor['parseAnchor'] = (anchor, isRtl) => {
    let [side, align] = anchor.split(' ')
    if (!align) {
      align = block.includes(side)
        ? 'start'
        : inline.includes(side)
          ? 'top'
          : 'center'
    }
    return {
      side: toPhysical(side as any, isRtl),
      align: toPhysical(align as any, isRtl),
    } as Mce.ParsedAnchor
  }

  function isNode(value: any): value is Node {
    return value instanceof Node
  }

  function isRoot(value: any): value is Node {
    return isNode(value) && root.value.equal(value)
  }

  function isElement(value: any): value is Element2D {
    return value instanceof Element2D
  }

  function isFrame(value: any): value is Element2D {
    return isElement(value) && value.meta.inEditorIs === 'Frame'
  }

  function isVisible(node: Node): boolean {
    return isElement(node) && node.style.visibility === 'visible'
  }

  function setVisible(node: Node, visible: boolean): void {
    if (isElement(node)) {
      node.style.visibility = visible ? 'visible' : 'hidden'
    }
  }

  function isLock(node: Node): boolean {
    return Boolean(node.meta.lock)
  }

  function setLock(node: Node, lock: boolean): void {
    node.meta.lock = lock
  }

  Object.assign(editor, {
    fonts,
    renderEngine,
    timeline,
    camera,
    drawboardEffect,
    doc,
    root,
    nodes,
    nodeIndexMap,
    selection,
    elementSelection,
    textSelection,
    hoverElement,
    drawboardDom,
    drawboardAabb,
    drawboardPointer,
    drawboardContextMenuPointer,
    state,
    setCursor,
    getGlobalPointer,
    parseAnchor,
    isNode,
    isRoot,
    isElement,
    isFrame,
    isVisible,
    setVisible,
    isLock,
    setLock,
  })

  return () => {
    const {
      on,
      root,
      state,
    } = editor

    function updateNodes(value?: Node) {
      let node: Node
      if (value) {
        node = value
      }
      else {
        nodes.value.length = 0
        nodeIndexMap.clear()
        node = root.value
      }
      for (const ch of node.children) {
        updateNodes(ch)
      }
      nodes.value.push(node)
      nodeIndexMap.set(node.id, nodes.value.length - 1)
    }

    on('setDoc', () => updateNodes())

    watch(selection, (value) => {
      // debug
      ;(window as any).$$0 = value[0]
    })

    watch(state, () => {
      textSelection.value = undefined
      hoverElement.value = undefined
    })
  }
})

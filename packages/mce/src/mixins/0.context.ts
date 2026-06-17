import type { Assets, Cursor } from 'modern-canvas'
import type { Vector2Like } from 'modern-path2d'
import type { IndexCharacter as _IndexCharacter } from 'modern-text/web-components'
import type { Ref } from 'vue'
import { useResizeObserver } from '@vueuse/core'
import { Aabb2D, assets, Camera2D, DrawboardEffect, Element2D, Engine, Node, Timeline } from 'modern-canvas'
import { Fonts } from 'modern-font'
import { Vector2 } from 'modern-path2d'
import { computed, markRaw, onBeforeMount, onScopeDispose, reactive, ref, watch } from 'vue'
import { defineMixin } from '../mixin'
import { Doc } from '../scene'

declare global {
  namespace Mce {
    type TBlock = 'top' | 'bottom'

    type TInline = 'start' | 'end' | 'left' | 'right'

    type Anchor
      = | TBlock
        | TInline
        | 'center'
        | 'center center'
        | `${TBlock} ${TInline | 'center'}`
        | `${TInline} ${TBlock | 'center'}`

    type ParsedAnchor
      = | { side: 'center', align: 'center' }
        | { side: TBlock, align: 'left' | 'right' | 'center' }
        | { side: 'left' | 'right', align: TBlock | 'center' }

    type IndexCharacter = _IndexCharacter

    type EditorNodeType = 'Doc' | 'Frame' | 'Slice' | 'Element'

    interface Editor {
      fonts: Fonts
      assets: Assets
      renderEngine: Ref<Engine>
      runExclusiveRender: <T>(fn: () => Promise<T> | T) => Promise<T>
      timeline: Ref<Timeline>
      camera: Ref<Camera2D>
      drawboardEffect: Ref<DrawboardEffect>
      setCursor: (mode: Cursor | undefined) => void
      drawboardDom: Ref<HTMLElement | undefined>
      drawboardAabb: Ref<Aabb2D>
      drawboardPointer: Ref<Vector2 | undefined>
      drawboardContextMenuPointer: Ref<Vector2 | undefined>
      root: Ref<Doc>
      docLoading: Ref<boolean>
      nodes: Ref<Node[]>
      nodeIndexMap: Map<string, number>
      selection: Ref<Node[]>
      selectionMarquee: Ref<Aabb2D>
      elementSelection: Ref<Element2D[]>
      textSelection: Ref<IndexCharacter[] | undefined>
      hoverElement: Ref<Element2D | undefined>
      state: Ref<State | undefined>
      mode: Ref<Mode>
      getGlobalPointer: () => Vector2Like
      parseAnchor: (anchor: Anchor, isRtl?: boolean) => ParsedAnchor
      isNode: (value: any) => value is Node
      isRootNode: (node: Node) => boolean
      isFrameNode: (node: Node, isTop?: boolean) => boolean
      inEditorIs: (node: Node, inEditorIs?: EditorNodeType) => boolean
      isElement: (value: any) => value is Element2D
      isVisible: (node: Node) => boolean
      setVisible: (node: Node, visible: boolean) => void
      isLock: (node: Node) => boolean
      setLock: (node: Node, lock: boolean) => void
    }
  }
}

export default defineMixin((editor, options) => {
  const root = ref(
    new Doc(options.db?.local ? 'doc' : undefined),
  )
  const docLoading = ref(false)
  const fonts = markRaw(new Fonts()) as Fonts
  const camera = ref(new Camera2D({ internalMode: 'front' }))
  const timeline = ref(new Timeline({ startTime: 0, currentTime: 0, endTime: 0, loop: true, paused: true }))
  const drawboardEffect = ref(new DrawboardEffect({ internalMode: 'back', effectMode: 'before' }))
  const _renderEngine = new Engine({
    pixelRatio: 2,
    fonts,
    timeline: timeline.value as any,
    fps: 0,
    speed: 0,
  })
  markRaw(_renderEngine.renderer)
  _renderEngine.root.append(camera.value as any)
  _renderEngine.root.append(drawboardEffect.value as any)
  _renderEngine.root.append(root.value as any)
  const renderEngine = ref(_renderEngine)

  const drawboardDom = ref<HTMLElement>()
  const drawboardAabb = ref(new Aabb2D())
  const drawboardPointer = ref<Vector2Like>()
  const drawboardContextMenuPointer = ref<Vector2Like>()
  const nodes = ref<Node[]>([])
  const nodeIndexMap = reactive(new Map<string, number>())
  const selection = ref<Element2D[]>([])
  const selectionMarquee = ref(new Aabb2D())
  const elementSelection = computed({
    get: () => selection.value.filter(v => isElement(v)),
    set: val => selection.value = val,
  })
  const textSelection = ref<any[]>()
  const hoverElement = ref<Element2D>()
  const state = ref<Mce.State>()
  const mode = ref<Mce.Mode>(options.mode ?? 'canvas')

  function setCursor(mode: Cursor | undefined): void {
    renderEngine.value.input.setCursor(mode)
  }

  // Off-screen exports (gif/mp4/image/...) drive a shared singleton render
  // engine and share resource objects (e.g. animatedTexture frame state) with
  // this editor's engine. If the editor keeps rendering during an export it
  // overwrites that shared state between async keyframes, freezing the output.
  // Stop the editor engine for the duration of the export to render exclusively.
  let exclusiveRenderDepth = 0
  async function runExclusiveRender<T>(fn: () => Promise<T> | T): Promise<T> {
    const engine = renderEngine.value
    if (exclusiveRenderDepth === 0) {
      engine.stop()
    }
    exclusiveRenderDepth++
    try {
      return await fn()
    }
    finally {
      exclusiveRenderDepth--
      if (exclusiveRenderDepth === 0) {
        engine.start()
      }
    }
  }

  function getGlobalPointer(): Vector2Like {
    const { x = 0, y = 0 } = drawboardPointer.value ?? {}
    return camera.value.toGlobal({ x, y }, { x: 0, y: 0 })
  }

  const block = ['top', 'bottom']
  const inline = ['start', 'end', 'left', 'right']

  function toPhysical(str: 'center' | Mce.TBlock | Mce.TInline, isRtl?: boolean): 'bottom' | 'center' | 'left' | 'right' | 'top' {
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

  function isRootNode(node: Node): boolean {
    return root.value.equal(node)
  }

  function isFrameNode(node: Node, isTop = false): boolean {
    return inEditorIs(node, 'Frame') && (
      !isTop
      || Boolean(node.parent?.equal(root.value as any))
    )
  }

  function isElement(value: any): value is Element2D {
    return value instanceof Element2D
  }

  function inEditorIs(value: Node, inEditorIs: Mce.EditorNodeType): boolean {
    return value.meta.inEditorIs === inEditorIs
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
    assets,
    renderEngine,
    runExclusiveRender,
    timeline,
    camera,
    drawboardEffect,
    docLoading,
    root,
    nodes,
    nodeIndexMap,
    selection,
    selectionMarquee,
    elementSelection,
    textSelection,
    hoverElement,
    drawboardDom,
    drawboardAabb,
    drawboardPointer,
    drawboardContextMenuPointer,
    state,
    mode,
    setCursor,
    getGlobalPointer,
    parseAnchor,
    isNode,
    isRootNode,
    isElement,
    inEditorIs,
    isFrameNode,
    isVisible,
    setVisible,
    isLock,
    setLock,
  })

  return () => {
    const {
      on,
      off,
      root,
      state,
      drawboardDom,
      drawboardAabb,
      drawboardPointer,
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

    function onSetDoc() {
      updateNodes()
      // 切文档：旧节点已随旧 doc destroy，集中清掉所有指向节点的共享态，避免野指针 / 残留 UI。
      // 这是「切文档统一清理」的单一入口，新增节点态请在此一并清，不要再各插件各记各的。
      selection.value = []
      hoverElement.value = undefined
      textSelection.value = undefined
    }

    if (options.debug) {
      watch(selection, (value) => {
        ;(window as any).$$0 = value[0]
      })
    }

    watch(state, () => {
      textSelection.value = undefined
      hoverElement.value = undefined
    })

    useResizeObserver(drawboardDom, (entries) => {
      const { left: _left, top: _top, width, height } = entries[0].contentRect
      const { left = _left, top = _top } = drawboardDom.value?.getBoundingClientRect() ?? {}
      drawboardAabb.value = new Aabb2D(left, top, width, height)
    })

    // mousemove 高频触发，用 rAF 合并到每帧一次，避免 hover 时持续写响应式 drawboardPointer
    let pointerRafId: number | null = null
    let lastPointerEvent: MouseEvent | undefined
    function onMouseMove(event: MouseEvent) {
      lastPointerEvent = event
      if (pointerRafId !== null) {
        return
      }
      pointerRafId = requestAnimationFrame(() => {
        pointerRafId = null
        const e = lastPointerEvent!
        drawboardPointer.value = new Vector2(
          e.clientX - drawboardAabb.value.left,
          e.clientY - drawboardAabb.value.top,
        )
      })
    }

    onBeforeMount(() => {
      on('docSet', onSetDoc)
      renderEngine.value.start()
      document.addEventListener('mousemove', onMouseMove)
    })

    onScopeDispose(() => {
      off('docSet', onSetDoc)
      renderEngine.value.stop()
      document.removeEventListener('mousemove', onMouseMove)
      if (pointerRafId !== null) {
        cancelAnimationFrame(pointerRafId)
      }
    })
  }
})

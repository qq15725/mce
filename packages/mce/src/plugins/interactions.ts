import type { Element2D, Node, PointerInputEvent } from 'modern-canvas'
import type { Ref } from 'vue'
import { onBeforeMount, onScopeDispose, ref, watch } from 'vue'
import InteractionBadges from '../components/InteractionBadges.vue'
import Interactions from '../components/Interactions.vue'
import { definePlugin } from '../plugin'

declare global {
  namespace Mce {
    type InteractionTrigger = 'click' | 'pointerEnter' | 'pointerLeave' | 'load' | 'scrollIntoView'
    type InteractionAction
      = | 'restart' | 'play' | 'pause' | 'toggle'
        | 'navigate' | 'openUrl' | 'toggleVisible' | 'setVariable'

    type ConditionOp = '==' | '!=' | '>' | '<'
    interface InteractionCondition {
      variableId: string
      op: ConditionOp
      value: any
    }

    interface Interaction {
      id: string
      trigger: InteractionTrigger
      action: InteractionAction
      /** 目标元素 / 帧 id，缺省为触发元素自身。 */
      target?: string
      url?: string
      frameId?: string
      variableId?: string
      value?: any
      /** 仅当条件成立才执行（轻量状态机：配合 setVariable）。 */
      condition?: InteractionCondition
    }

    interface Editor {
      /** 预览（可交互）模式：开启后点击元素触发其交互，编辑操作被禁用。 */
      previewMode: Ref<boolean>
      /** 交互数据变更计数（meta 写入非响应式，用它驱动 UI 刷新）。 */
      interactionsRev: Ref<number>
      /** 滚动驱动：预览态下用滚轮进度驱动时间轴播放头（scrollytelling）。 */
      scrollDriven: Ref<boolean>
    }

    interface Commands {
      getElementInteractions: (node?: Element2D) => Interaction[]
      setElementInteractions: (interactions: Interaction[], node?: Element2D) => void
      togglePreview: () => void
      runInteraction: (interaction: Interaction, source: Node) => void
    }
  }
}

let _seq = 0
export function createInteractionId(): string {
  // 不依赖 Date.now/Math.random（环境禁用），用自增 + 实例计数。
  _seq += 1
  return `it_${_seq}_${_seq * 2654435761 % 100000}`
}

export default definePlugin((editor) => {
  const {
    root,
    getNodeById,
    isElement,
    elementSelection,
    selection,
    isVisible,
    setVisible,
    exec,
  } = editor

  const previewMode = ref(false)
  const interactionsRev = ref(0)
  const scrollDriven = ref(false)
  Object.assign(editor, { previewMode, interactionsRev, scrollDriven })

  function getInteractions(node?: Node): Mce.Interaction[] {
    const meta = (node?.meta as any)?.toJSON?.()
    return (meta?.interactions as Mce.Interaction[] | undefined) ?? []
  }

  function setElementInteractions(interactions: Mce.Interaction[], node = elementSelection.value[0]): void {
    if (!node)
      return
    root.value?.transact(() => {
      ;(node.meta as any).interactions = interactions
    })
    interactionsRev.value++
  }

  function findById(id?: string): Node | undefined {
    if (!id)
      return undefined
    // O(1)：走 SceneTree.nodeMap，替代原 root.findOne 的 O(n) 遍历。
    return getNodeById(id)
  }

  function currentVariableValue(variableId: string): any {
    const state = exec('getVariablesState')
    const collection = state.collections.find(c => c.variables.some(v => v.id === variableId))
    if (!collection)
      return undefined
    const variable = collection.variables.find(v => v.id === variableId)
    return variable?.valuesByMode?.[collection.defaultModeId]
  }

  function passesCondition(c: Mce.InteractionCondition): boolean {
    const cur = currentVariableValue(c.variableId)
    switch (c.op) {
      case '==': return String(cur) === String(c.value)
      case '!=': return String(cur) !== String(c.value)
      case '>': return Number(cur) > Number(c.value)
      case '<': return Number(cur) < Number(c.value)
      default: return true
    }
  }

  function runInteraction(it: Mce.Interaction, source: Node): void {
    if (it.condition?.variableId && !passesCondition(it.condition))
      return
    // play/pause 类动作作用于「目标元素自身」的动画（独立播放，各元素各自计时），
    // 缺省目标为触发元素自身。
    const animTarget = (resolveElement(findById(it.target) ?? source) ?? source) as any
    switch (it.action) {
      case 'restart':
        exec('playElementAnimation', animTarget, true)
        break
      case 'play':
        exec('playElementAnimation', animTarget, false)
        break
      case 'pause':
        exec('pauseElementAnimation', animTarget)
        break
      case 'toggle':
        exec('toggleElementAnimation', animTarget)
        break
      case 'openUrl':
        if (it.url)
          window.open(it.url, '_blank', 'noopener')
        break
      case 'toggleVisible': {
        const t = (findById(it.target) ?? source) as Node
        if (t)
          setVisible(t, !isVisible(t))
        break
      }
      case 'navigate': {
        const frame = findById(it.frameId)
        if (frame) {
          selection.value = [frame]
          exec('zoomToSelection')
        }
        break
      }
      case 'setVariable': {
        if (it.variableId === undefined)
          break
        const state = exec('getVariablesState')
        const collection = state.collections.find(c => c.variables.some(v => v.id === it.variableId))
        if (collection)
          exec('setVariableValue', it.variableId, collection.defaultModeId, it.value)
        break
      }
    }
  }

  // 解析到最近的可交互元素（沿祖先）。
  function resolveElement(node?: Node): Node | undefined {
    let n = node
    while (n) {
      if (isElement(n))
        return n
      n = n.parent as Node | undefined
    }
    return undefined
  }

  function fire(node: Node | undefined, trigger: Mce.InteractionTrigger): void {
    if (!node)
      return
    // 同一次触发内，所有条件对「触发前」的状态快照求值（filter 先于 forEach 执行），
    // 这样互斥条件 + setVariable 能实现稳定的状态切换（轻量状态机）。
    getInteractions(node)
      .filter(i => i.trigger === trigger)
      .filter(i => !i.condition?.variableId || passesCondition(i.condition))
      .forEach(it => runInteraction(it, node))
  }

  // 预览态：点击命中元素 → 执行其 click 交互。
  function onPreviewPointerDown(e: PointerInputEvent): void {
    if (!previewMode.value)
      return
    fire(resolveElement(e.target as Node | undefined), 'click')
  }

  // 预览态：跟踪 hover 元素变化，触发 pointerEnter / pointerLeave。
  let hovered: Node | undefined
  function onPreviewPointerMove(e: PointerInputEvent): void {
    if (!previewMode.value)
      return
    const el = resolveElement(e.target as Node | undefined)
    if (el === hovered)
      return
    fire(hovered, 'pointerLeave')
    hovered = el
    fire(hovered, 'pointerEnter')
  }

  // 进入预览时触发所有 load 交互。
  function runLoadInteractions(): void {
    root.value?.findOne((n: Node) => {
      if (isElement(n)) {
        getInteractions(n).filter(i => i.trigger === 'load').forEach(it => runInteraction(it, n))
      }
      return false
    })
  }

  // scrollIntoView：进入预览时收集带该触发的元素，元素滚入视口时触发一次。
  let scrollWatch: Node[] = []
  const firedScroll = new WeakSet<Node>()
  function collectScrollWatch(): void {
    scrollWatch = []
    root.value?.findOne((n: Node) => {
      if (isElement(n) && getInteractions(n).some(i => i.trigger === 'scrollIntoView'))
        scrollWatch.push(n)
      return false
    })
  }
  function checkScrollIntoView(): void {
    if (!previewMode.value || !scrollWatch.length)
      return
    const vp = (editor as any).drawboardAabb?.value
    if (!vp)
      return
    for (const n of scrollWatch) {
      if (firedScroll.has(n))
        continue
      const a = (editor as any).getAabb(n, 'drawboard')
      const inView = a.left < vp.width && a.left + a.width > 0 && a.top < vp.height && a.top + a.height > 0
      if (inView) {
        firedScroll.add(n)
        fire(n, 'scrollIntoView')
      }
    }
  }

  function onKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape' && previewMode.value) {
      previewMode.value = false
    }
  }

  // 滚动驱动：累计滚轮进度 → 时间轴播放头。
  let scrollProgress = 0
  function resetScroll(): void {
    scrollProgress = 0
    if (previewMode.value && scrollDriven.value)
      editor.currentTime.value = 0
  }
  // 滚轮是否落在可自身滚动、且该方向尚未到尽头的浮层内（如评论列表）。是则让其原生滚动，不驱动播放头。
  function overNativeScrollable(target: EventTarget | null, dx: number, dy: number): boolean {
    let el = target instanceof Element ? target : null
    while (el && el !== document.body) {
      if (el instanceof HTMLElement) {
        const style = getComputedStyle(el)
        if (dy && /auto|scroll/.test(style.overflowY) && el.scrollHeight > el.clientHeight)
          return true
        if (dx && /auto|scroll/.test(style.overflowX) && el.scrollWidth > el.clientWidth)
          return true
      }
      el = el.parentElement
    }
    return false
  }
  function onWheel(e: WheelEvent): void {
    if (!previewMode.value || !scrollDriven.value)
      return
    if (overNativeScrollable(e.target, e.deltaX, e.deltaY))
      return
    e.preventDefault()
    scrollProgress = Math.min(1, Math.max(0, scrollProgress + e.deltaY / 2000))
    editor.currentTime.value = scrollProgress * editor.endTime.value
  }

  return {
    name: 'mce:interactions',
    components: [
      {
        name: 'interactions',
        type: 'panel',
        position: 'float',
        component: Interactions,
      },
      { type: 'overlay', component: InteractionBadges, order: 'before' },
    ],
    commands: [
      { command: 'getElementInteractions', handle: getInteractions as any },
      { command: 'setElementInteractions', handle: setElementInteractions },
      { command: 'togglePreview', handle: () => previewMode.value = !previewMode.value },
      { command: 'runInteraction', handle: runInteraction },
    ],
    hotkeys: [
      { command: 'togglePanel:interactions', key: 'Alt+5' },
    ],
    setup: () => {
      const engine = editor.renderEngine.value

      watch(previewMode, (on) => {
        hovered = undefined
        if (on) {
          if (scrollDriven.value) {
            exec('pause')
            resetScroll()
          }
          runLoadInteractions()
          collectScrollWatch()
          checkScrollIntoView()
        }
      })

      watch(scrollDriven, (on) => {
        if (on && previewMode.value) {
          exec('pause')
          resetScroll()
        }
      })

      onBeforeMount(() => {
        engine.on('pointerdown', onPreviewPointerDown)
        engine.on('pointermove', onPreviewPointerMove)
        engine.on('rendered', checkScrollIntoView)
        window.addEventListener('keydown', onKeydown)
        window.addEventListener('wheel', onWheel, { passive: false, capture: true })
      })

      onScopeDispose(() => {
        engine.off('pointerdown', onPreviewPointerDown)
        engine.off('pointermove', onPreviewPointerMove)
        engine.off('rendered', checkScrollIntoView)
        window.removeEventListener('keydown', onKeydown)
        window.removeEventListener('wheel', onWheel, { capture: true } as any)
      })
    },
  }
})

import type { Element2D, Node } from 'modern-canvas'
import type { Keyframe, PresetChannels } from '../utils'
import { Animation } from 'modern-canvas'
import { definePlugin } from '../plugin'
import {
  buildLottie,
  removeKeyframeAt,
  setKeyframeEasing,
  upsertKeyframe,
} from '../utils'

declare global {
  namespace Mce {
    interface ExportLottieOptions {
      width?: number
      height?: number
      fps?: number
    }

    interface AnimationTiming {
      duration?: number
      delay?: number
    }

    interface Commands {
      getElementKeyframes: (node?: Element2D) => Keyframe[]
      /** 在指定时间点（offset 0..1）插入 / 更新关键帧（合并 props）。 */
      addAnimationKeyframe: (offset: number, props: Record<string, any>, node?: Element2D) => void
      removeAnimationKeyframe: (offset: number, node?: Element2D) => void
      setAnimationKeyframeEasing: (offset: number, easing: string, node?: Element2D) => void
      setAnimationTiming: (timing: AnimationTiming, node?: Element2D) => void
      /** 应用预设动画（进入 / 退出 / 强调），按元素当前样式生成关键帧；同类预设会被替换。 */
      applyAnimationPreset: (id: string, node?: Element2D) => void
      /** 独立播放某元素自身的动画（脱离全局时间轴，各元素各自计时）。restart 从头播，否则续播。 */
      playElementAnimation: (node?: Element2D, restart?: boolean) => void
      /** 暂停某元素的独立播放，冻结在当前帧。 */
      pauseElementAnimation: (node?: Element2D) => void
      /** 切换某元素独立播放 / 暂停。 */
      toggleElementAnimation: (node?: Element2D) => void
      /** 停止独立播放并恢复跟随全局时间轴。 */
      stopElementAnimation: (node?: Element2D) => void
      /** 注册可复用的自定义缓动（名字 → cubic-bezier 字符串），存于文档。 */
      registerEasing: (name: string, value: string) => void
      getEasings: () => Record<string, string>
      /** 把场景里所有带关键帧动画的元素导出为 Lottie JSON（transform / opacity 通道）。 */
      exportLottie: (options?: ExportLottieOptions) => object
    }
  }
}

export default definePlugin((editor) => {
  const {
    root,
    isElement,
    elementSelection,
    rootAabb,
  } = editor
  // fps 由 timeline 插件提供，可能在本插件之后注册，故惰性读取避免解构到 undefined。

  function getAnimation(node: Element2D): Animation | undefined {
    return node.children.find((c): c is Animation => c instanceof Animation)
  }

  // 挂到「响应式」元素上（不要 toRaw），让 appendChild 把 Animation 也纳入代理 /
  // CRDT 注册，与场景里其它节点一致，否则渲染引擎不会处理这个裸节点。
  function ensureAnimation(node: Element2D): Animation {
    let anim = getAnimation(node)
    if (!anim) {
      anim = new Animation({ duration: 2000, keyframes: [] })
      root.value?.transact(() => node.appendChild(anim!))
    }
    return anim
  }

  // ── 单元素独立播放运行器 ───────────────────────────────────────────────
  // 引擎以 fps:0/speed:0 每帧渲染但 delta 恒为 0，时间由外部驱动。这里用一个
  // 共享 RAF 逐帧推进各元素的「本地时钟」，并通过 Animation.setLocalTime 注入，
  // 使每个元素的动画脱离全局时间轴各自计时（交互触发各播各的）。
  interface ActiveEl {
    node: Element2D
    anims: Animation[]
    t: number
    /** 元素动画总跨度 max(delay+duration)。 */
    span: number
    /** 任一动画 loop 则整体循环。 */
    loop: boolean
    rate: number
  }
  const activeEls = new Map<Element2D, ActiveEl>()
  let rafId: number | undefined
  let prevTime: number | undefined

  function elementAnimations(node: Element2D): Animation[] {
    return node.children.filter((c): c is Animation => c instanceof Animation)
  }

  function applyLocal(a: ActiveEl): void {
    a.anims.forEach(anim => anim.setLocalTime(a.t - (anim.delay ?? 0)))
  }

  function frame(now: number): void {
    const dt = prevTime === undefined ? 0 : now - prevTime
    prevTime = now
    const finished: Element2D[] = []
    activeEls.forEach((a) => {
      a.t += dt * a.rate
      if (a.loop) {
        if (a.span > 0)
          a.t %= a.span
      }
      else if (a.t >= a.span) {
        a.t = a.span
        applyLocal(a)
        finished.push(a.node) // 播完冻结在末帧（保持入场后的显示），移出 RAF
        return
      }
      applyLocal(a)
    })
    finished.forEach(node => activeEls.delete(node))
    if (activeEls.size) {
      rafId = requestAnimationFrame(frame)
    }
    else {
      rafId = undefined
      prevTime = undefined
    }
  }

  function ensureRaf(): void {
    if (rafId === undefined) {
      prevTime = undefined
      rafId = requestAnimationFrame(frame)
    }
  }

  function playElementAnimation(node = elementSelection.value[0], restart = true): void {
    if (!node)
      return
    const anims = elementAnimations(node)
    if (!anims.length)
      return
    anims.forEach(a => a.setStandalone(true))
    const span = Math.max(0, ...anims.map(a => (a.delay ?? 0) + (a.duration ?? 0)))
    const loop = anims.some(a => !!a.loop)
    const existing = activeEls.get(node)
    activeEls.set(node, {
      node,
      anims,
      span,
      loop,
      rate: 1,
      t: restart || !existing ? 0 : existing.t,
    })
    ensureRaf()
  }

  function pauseElementAnimation(node = elementSelection.value[0]): void {
    if (node)
      activeEls.delete(node) // 退出 RAF，standalone 保持 → 冻结在当前帧
  }

  function toggleElementAnimation(node = elementSelection.value[0]): void {
    if (!node)
      return
    if (activeEls.has(node))
      pauseElementAnimation(node)
    else
      playElementAnimation(node, false)
  }

  function stopElementAnimation(node = elementSelection.value[0]): void {
    if (!node)
      return
    activeEls.delete(node)
    elementAnimations(node).forEach(a => a.setStandalone(false)) // 回到全局时间轴
  }

  function getElementKeyframes(node = elementSelection.value[0]): Keyframe[] {
    if (!node)
      return []
    return (getAnimation(node)?.keyframes as unknown as Keyframe[] | undefined) ?? []
  }

  function mutateKeyframes(node: Element2D | undefined, fn: (kfs: Keyframe[]) => Keyframe[]): void {
    if (!node)
      return
    const anim = ensureAnimation(node)
    anim.keyframes = fn((anim.keyframes as unknown as Keyframe[] | undefined) ?? []) as any
  }

  function addAnimationKeyframe(offset: number, props: Record<string, any>, node = elementSelection.value[0]): void {
    mutateKeyframes(node, kfs => upsertKeyframe(kfs, { ...props, offset }))
  }

  function removeAnimationKeyframe(offset: number, node = elementSelection.value[0]): void {
    mutateKeyframes(node, kfs => removeKeyframeAt(kfs, offset))
  }

  function setAnimationKeyframeEasing(offset: number, easing: string, node = elementSelection.value[0]): void {
    mutateKeyframes(node, kfs => setKeyframeEasing(kfs, offset, easing))
  }

  function setAnimationTiming(timing: Mce.AnimationTiming, node = elementSelection.value[0]): void {
    if (!node)
      return
    const anim = ensureAnimation(node)
    if (timing.duration !== undefined)
      anim.duration = timing.duration
    if (timing.delay !== undefined)
      anim.delay = timing.delay
  }

  function readBaseChannels(node: Element2D): PresetChannels {
    const s = node.style as any
    return {
      left: s?.left ?? 0,
      top: s?.top ?? 0,
      rotate: s?.rotate ?? 0,
      scaleX: s?.scaleX ?? 1,
      scaleY: s?.scaleY ?? 1,
      opacity: s?.opacity ?? 1,
    }
  }

  function presetCategoryOf(anim: Animation): string | undefined {
    // meta 自定义键经 toJSON 读回（与 registerEasing 一致）。
    return (anim.meta as any)?.toJSON?.()?.presetCategory
  }

  function applyAnimationPreset(id: string, node = elementSelection.value[0]): void {
    if (!node)
      return
    const preset = editor.getAnimationPreset(id)
    if (!preset)
      return
    const keyframes = preset.build(readBaseChannels(node))
    // 剪映式：片段需有长度，进入锚头、退出锚尾。元素无时长时给个默认片段长度
    // （只约束动画范围，不影响元素在画布上的常驻显示）。
    const DEFAULT_CLIP = 3000
    let clip = (node as any).duration as number
    if (!clip || clip <= 0)
      clip = DEFAULT_CLIP
    const delay = preset.category === 'out' ? Math.max(0, clip - preset.duration) : 0
    // 同类预设动画存在则替换，否则新建一个 Animation 子节点。
    // 用响应式 node（不要 toRaw），让新建的 Animation 也被代理 / 注册进场景，
    // 否则渲染引擎不会处理这个未代理的裸节点（动画不生效）。
    const el = node as any
    const existing = el.children.find((c: any): c is Animation =>
      c instanceof Animation && presetCategoryOf(c) === preset.category)
    root.value?.transact(() => {
      if (!el.duration || el.duration <= 0)
        el.duration = clip
      let anim: Animation = existing
      if (!anim) {
        anim = new Animation({ duration: preset.duration, keyframes: [] })
        el.appendChild(anim)
      }
      anim.keyframes = keyframes as any
      anim.duration = preset.duration
      anim.delay = delay
      anim.loop = !!preset.loop
      ;(anim.meta as any).presetCategory = preset.category
      ;(anim.meta as any).presetId = id
    })
    ;(editor as any).recomputeTimelineEndTime?.()
  }

  function rootMeta(): Record<string, any> | undefined {
    return root.value?.meta as any
  }

  function getEasings(): Record<string, string> {
    // Meta 自定义键只能经 toJSON 读回（属性 getter 不支持任意键）。
    return rootMeta()?.toJSON?.()?.easings ?? {}
  }

  function registerEasing(name: string, value: string): void {
    const meta = rootMeta()
    if (meta) {
      meta.easings = { ...getEasings(), [name]: value }
    }
  }

  function exportLottie(options: Mce.ExportLottieOptions = {}): object {
    const aabb = rootAabb.value
    const width = options.width ?? aabb.width ?? 800
    const height = options.height ?? aabb.height ?? 600
    const frameRate = options.fps ?? (editor as any).fps?.value ?? 30
    const custom = getEasings()

    const layers: Parameters<typeof buildLottie>[0]['layers'] = []
    let durationMs = 0

    root.value?.findOne((node: Node) => {
      if (isElement(node)) {
        const el = node as Element2D
        const anim = getAnimation(el)
        const keyframes = (anim?.keyframes as unknown as Keyframe[] | undefined) ?? []
        if (anim && keyframes.length) {
          const style = el.style as any
          layers.push({
            name: el.name,
            width: style.width ?? 0,
            height: style.height ?? 0,
            keyframes,
            base: {
              left: style.left ?? 0,
              top: style.top ?? 0,
              opacity: style.opacity ?? 1,
              rotate: style.rotate ?? 0,
              scaleX: style.scaleX ?? 1,
              scaleY: style.scaleY ?? 1,
            },
          })
          durationMs = Math.max(durationMs, (anim.delay ?? 0) + (anim.duration ?? 0))
        }
      }
      return false
    })

    return buildLottie({ width, height, fps: frameRate, durationMs: durationMs || 1000, layers, custom })
  }

  return {
    name: 'mce:animate',
    commands: [
      { command: 'getElementKeyframes', handle: getElementKeyframes },
      { command: 'addAnimationKeyframe', handle: addAnimationKeyframe },
      { command: 'removeAnimationKeyframe', handle: removeAnimationKeyframe },
      { command: 'setAnimationKeyframeEasing', handle: setAnimationKeyframeEasing },
      { command: 'setAnimationTiming', handle: setAnimationTiming },
      { command: 'applyAnimationPreset', handle: applyAnimationPreset },
      { command: 'playElementAnimation', handle: playElementAnimation },
      { command: 'pauseElementAnimation', handle: pauseElementAnimation },
      { command: 'toggleElementAnimation', handle: toggleElementAnimation },
      { command: 'stopElementAnimation', handle: stopElementAnimation },
      { command: 'registerEasing', handle: registerEasing },
      { command: 'getEasings', handle: getEasings },
      { command: 'exportLottie', handle: exportLottie },
    ],
  }
})

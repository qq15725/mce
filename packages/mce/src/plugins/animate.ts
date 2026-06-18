import type { Element2D, Node } from 'modern-canvas'
import type { Keyframe } from '../utils'
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

  // 注意：新建 Animation 子节点会经 CRDT 代理同步，实时行为需在编辑器内复核。
  function ensureAnimation(node: Element2D): Animation {
    let anim = getAnimation(node)
    if (!anim) {
      anim = new Animation({ duration: 2000, keyframes: [] })
      root.value?.transact(() => node.appendChild(anim!))
    }
    return anim
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
    mutateKeyframes(node, kfs => upsertKeyframe(kfs, { offset, props }))
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
              rotation: style.rotation ?? 0,
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
      { command: 'registerEasing', handle: registerEasing },
      { command: 'getEasings', handle: getEasings },
      { command: 'exportLottie', handle: exportLottie },
    ],
  }
})

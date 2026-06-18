import type { Keyframe } from './keyframes'
import { parseEasing } from './easing'
import { keyframeProps, sortKeyframes } from './keyframes'

/**
 * 关键帧动画 → Lottie JSON 构建器（纯函数）。
 *
 * 限定到 transform / opacity 通道（position / rotation / scale / opacity）——这是画布动画里
 * 最常见、也最能跨工具复用的部分；不导出形状几何（shapes 留空）。每个动画元素映射为一个
 * Lottie layer，关键帧的 easing 转成 Lottie 的贝塞尔 in/out 手柄。结构层面可单测。
 */

export interface LottieLayerInput {
  name?: string
  width: number
  height: number
  /** 关键帧可含 left/top/opacity/rotate/scaleX/scaleY 等扁平属性。 */
  keyframes: Keyframe[]
  /** 未被关键帧覆盖的通道用此回退值（left/top/opacity/rotate/scaleX/scaleY）。 */
  base?: Record<string, number>
}

export interface LottieCompositionInput {
  width: number
  height: number
  fps?: number
  durationMs: number
  layers: LottieLayerInput[]
  /** 自定义缓动注册表（名字 → cubic-bezier 字符串）。 */
  custom?: Record<string, string>
}

type LottieProp = { a: 0, k: number | number[] } | { a: 1, k: any[] }

function toArray(v: number | number[]): number[] {
  return Array.isArray(v) ? v : [v]
}

/** 构造一个 Lottie 动画 / 静态属性通道。 */
function channel(
  keyframes: Keyframe[],
  totalFrames: number,
  pick: (props: Record<string, any>) => number | number[] | undefined,
  fallback: number | number[],
  custom: Record<string, string>,
): LottieProp {
  const points: { offset: number, easing?: string, value: number | number[] }[] = []
  for (const kf of sortKeyframes(keyframes)) {
    const value = pick(keyframeProps(kf))
    if (value !== undefined) {
      points.push({ offset: kf.offset, easing: kf.easing, value })
    }
  }

  if (points.length === 0) {
    return { a: 0, k: fallback }
  }
  if (points.length === 1) {
    return { a: 0, k: points[0].value }
  }

  const k = points.map((p, i) => {
    const t = Math.round(p.offset * totalFrames)
    if (i === points.length - 1) {
      return { t, s: toArray(p.value) }
    }
    const [x1, y1, x2, y2] = parseEasing(p.easing, custom)
    return { t, s: toArray(p.value), o: { x: [x1], y: [y1] }, i: { x: [x2], y: [y2] } }
  })
  return { a: 1, k }
}

function buildLayer(
  layer: LottieLayerInput,
  index: number,
  totalFrames: number,
  custom: Record<string, string>,
): object {
  const base = layer.base ?? {}
  const kfs = layer.keyframes

  return {
    ty: 4, // shape layer
    nm: layer.name ?? `layer-${index + 1}`,
    ind: index + 1,
    ip: 0,
    op: totalFrames,
    st: 0,
    sr: 1,
    bm: 0,
    ao: 0,
    ks: {
      o: channel(kfs, totalFrames, p => (p.opacity != null ? [p.opacity * 100] : undefined), [(base.opacity ?? 1) * 100], custom),
      r: channel(kfs, totalFrames, p => (p.rotate != null ? [p.rotate] : undefined), [base.rotate ?? 0], custom),
      p: channel(
        kfs,
        totalFrames,
        p => (p.left != null || p.top != null ? [p.left ?? base.left ?? 0, p.top ?? base.top ?? 0, 0] : undefined),
        [base.left ?? 0, base.top ?? 0, 0],
        custom,
      ),
      a: { a: 0 as const, k: [0, 0, 0] },
      s: channel(
        kfs,
        totalFrames,
        p => (p.scaleX != null || p.scaleY != null ? [(p.scaleX ?? 1) * 100, (p.scaleY ?? 1) * 100, 100] : undefined),
        [(base.scaleX ?? 1) * 100, (base.scaleY ?? 1) * 100, 100],
        custom,
      ),
    },
    shapes: [],
  }
}

export function buildLottie(comp: LottieCompositionInput): object {
  const fr = comp.fps ?? 30
  const op = Math.max(1, Math.round((comp.durationMs / 1000) * fr))
  const custom = comp.custom ?? {}

  return {
    v: '5.7.0',
    fr,
    ip: 0,
    op,
    w: Math.round(comp.width),
    h: Math.round(comp.height),
    nm: 'mce-export',
    ddd: 0,
    assets: [],
    layers: comp.layers.map((layer, i) => buildLayer(layer, i, op, custom)),
  }
}

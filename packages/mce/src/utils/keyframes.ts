import { evalEasing } from './easing'

/**
 * 关键帧编辑纯逻辑层，兼容 modern-canvas Animation 的关键帧表示
 * （keyframe = { offset: 0..1, easing, props }）。提供数组级 CRUD（不可变）与按进度采样插值，
 * 供编辑面板与 Lottie 导出复用。纯函数，可独立单测。
 */

export interface Keyframe {
  /** 归一化时间点 0..1。 */
  offset: number
  /** 命名预设 / cubic-bezier 字符串 / 自定义缓动名；缺省 linear。 */
  easing?: string
  /** 该关键帧上的样式属性快照。 */
  props: Record<string, any>
}

export function sortKeyframes(keyframes: Keyframe[]): Keyframe[] {
  return [...keyframes].sort((a, b) => a.offset - b.offset)
}

/** 插入或替换同 offset 的关键帧（合并 props），返回排序后的新数组。 */
export function upsertKeyframe(keyframes: Keyframe[], kf: Keyframe): Keyframe[] {
  const i = keyframes.findIndex(k => k.offset === kf.offset)
  if (i === -1) {
    return sortKeyframes([...keyframes, kf])
  }
  const next = [...keyframes]
  next[i] = { ...next[i], ...kf, props: { ...next[i].props, ...kf.props } }
  return sortKeyframes(next)
}

export function removeKeyframeAt(keyframes: Keyframe[], offset: number): Keyframe[] {
  return keyframes.filter(k => k.offset !== offset)
}

export function updateKeyframeProps(
  keyframes: Keyframe[],
  offset: number,
  props: Record<string, any>,
): Keyframe[] {
  return keyframes.map(k =>
    k.offset === offset ? { ...k, props: { ...k.props, ...props } } : k,
  )
}

export function setKeyframeEasing(keyframes: Keyframe[], offset: number, easing: string): Keyframe[] {
  return keyframes.map(k => (k.offset === offset ? { ...k, easing } : k))
}

/**
 * 在进度 t∈[0,1] 处采样属性值。对每个属性在「t 所在区间」的左右关键帧之间插值，
 * 区间缓动取**左关键帧**的 easing（与 CSS/Lottie 的「段缓动属于起点」一致）；数值线性插值，
 * 非数值用阶梯（取左值）。返回该时刻所有出现过的属性的值。
 * custom 为自定义缓动注册表（名字 → cubic-bezier 字符串）。
 */
export function sampleKeyframes(
  keyframes: Keyframe[],
  t: number,
  custom: Record<string, string> = {},
): Record<string, any> {
  const sorted = sortKeyframes(keyframes)
  if (sorted.length === 0)
    return {}
  if (t <= sorted[0].offset)
    return { ...sorted[0].props }
  if (t >= sorted[sorted.length - 1].offset)
    return { ...sorted[sorted.length - 1].props }

  let lo = sorted[0]
  let hi = sorted[sorted.length - 1]
  for (let i = 0; i < sorted.length - 1; i++) {
    if (t >= sorted[i].offset && t <= sorted[i + 1].offset) {
      lo = sorted[i]
      hi = sorted[i + 1]
      break
    }
  }

  const span = hi.offset - lo.offset
  const localT = span > 0 ? (t - lo.offset) / span : 0
  const eased = evalEasing(lo.easing, localT, custom)

  const result: Record<string, any> = { ...lo.props }
  const keys = new Set([...Object.keys(lo.props), ...Object.keys(hi.props)])
  keys.forEach((key) => {
    const a = lo.props[key]
    const b = hi.props[key]
    if (typeof a === 'number' && typeof b === 'number') {
      result[key] = a + (b - a) * eased
    }
    else {
      result[key] = eased < 1 ? (a ?? b) : (b ?? a)
    }
  })
  return result
}

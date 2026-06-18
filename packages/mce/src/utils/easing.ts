/**
 * 可复用缓动（easing）纯逻辑层。
 *
 * 与 modern-canvas Animation 的 easing 表示兼容（命名预设或 'cubic-bezier(...)' 字符串）。
 * 这里额外提供：cubic-bezier 求值器（用于关键帧采样 / Lottie 导出预览）、命名预设表、
 * 以及「自定义缓动注册表」解析（Jitter 式可复用缓动）。纯函数，可独立单测。
 */

export type EasingCoords = [number, number, number, number]

/** 命名缓动预设 → cubic-bezier 控制点。 */
export const EASING_PRESETS: Record<string, EasingCoords> = {
  'linear': [0, 0, 1, 1],
  'ease': [0.25, 0.1, 0.25, 1],
  'ease-in': [0.42, 0, 1, 1],
  'ease-out': [0, 0, 0.58, 1],
  'ease-in-out': [0.42, 0, 0.58, 1],
  'ease-in-quad': [0.55, 0.085, 0.68, 0.53],
  'ease-out-quad': [0.25, 0.46, 0.45, 0.94],
  'ease-in-out-quad': [0.455, 0.03, 0.515, 0.955],
  'ease-in-cubic': [0.55, 0.055, 0.675, 0.19],
  'ease-out-cubic': [0.215, 0.61, 0.355, 1],
  'ease-in-out-cubic': [0.645, 0.045, 0.355, 1],
}

function parseCubicBezier(value: string): EasingCoords | undefined {
  const m = value.match(/cubic-bezier\(([^)]+)\)/)
  if (!m)
    return undefined
  const parts = m[1].split(',').map(s => Number(s.trim()))
  if (parts.length === 4 && parts.every(n => Number.isFinite(n))) {
    return parts as EasingCoords
  }
  return undefined
}

/**
 * 把 easing 表示解析为 cubic-bezier 控制点。
 * 接受：命名预设、'cubic-bezier(...)' 字符串、或自定义注册表里的名字。无法解析 → linear。
 */
export function parseEasing(
  easing: string | undefined,
  custom: Record<string, string> = {},
): EasingCoords {
  if (!easing)
    return EASING_PRESETS.linear
  if (easing in EASING_PRESETS)
    return EASING_PRESETS[easing]
  const direct = parseCubicBezier(easing)
  if (direct)
    return direct
  // 自定义注册表：名字 → cubic-bezier 字符串（或另一个预设名）。
  const registered = custom[easing]
  if (registered) {
    return parseCubicBezier(registered) ?? EASING_PRESETS[registered] ?? EASING_PRESETS.linear
  }
  return EASING_PRESETS.linear
}

/** 由控制点构造 cubic-bezier 求值函数：输入进度 x∈[0,1]，返回缓动后的 y。 */
export function cubicBezierEasing([x1, y1, x2, y2]: EasingCoords): (x: number) => number {
  const cx = 3 * x1
  const bx = 3 * (x2 - x1) - cx
  const ax = 1 - cx - bx
  const cy = 3 * y1
  const by = 3 * (y2 - y1) - cy
  const ay = 1 - cy - by

  const sampleX = (t: number): number => ((ax * t + bx) * t + cx) * t
  const sampleY = (t: number): number => ((ay * t + by) * t + cy) * t
  const sampleDX = (t: number): number => (3 * ax * t + 2 * bx) * t + cx

  function solveT(x: number): number {
    // Newton-Raphson，失败回退二分。
    let t = x
    for (let i = 0; i < 8; i++) {
      const dx = sampleX(t) - x
      if (Math.abs(dx) < 1e-6)
        return t
      const d = sampleDX(t)
      if (Math.abs(d) < 1e-6)
        break
      t -= dx / d
    }
    let lo = 0
    let hi = 1
    t = x
    for (let i = 0; i < 20; i++) {
      const xv = sampleX(t)
      if (Math.abs(xv - x) < 1e-6)
        return t
      if (x > xv)
        lo = t
      else
        hi = t
      t = (lo + hi) / 2
    }
    return t
  }

  return (x: number): number => {
    if (x <= 0)
      return 0
    if (x >= 1)
      return 1
    return sampleY(solveT(x))
  }
}

/** 直接对进度 t∈[0,1] 求缓动值。 */
export function evalEasing(
  easing: string | undefined,
  t: number,
  custom: Record<string, string> = {},
): number {
  return cubicBezierEasing(parseEasing(easing, custom))(t)
}

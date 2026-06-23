import type { Keyframe } from './keyframes'

/**
 * 动画预设的类型契约（核心只提供类型，不内置任何预设）。
 * 预设由插件 / 宿主经 `editor.registerAnimationPreset` 注册，分进入 / 退出 / 强调三类。
 *
 * 约定：`build` 依据元素「当前基础样式」生成扁平关键帧（而非写死绝对值），
 * 利用 modern-canvas Animation 的两端填充——进入收尾停在基础值、退出收尾保持终值，
 * 无需额外 fill 配置。
 */

export type PresetCategory = 'in' | 'out' | 'emphasis'

export interface PresetChannels {
  left: number
  top: number
  rotate: number
  scaleX: number
  scaleY: number
  opacity: number
}

export interface AnimationPreset {
  id: string
  category: PresetCategory
  /** 默认时长（ms）。 */
  duration: number
  /** 强调类通常循环。 */
  loop?: boolean
  /** 依据元素基础样式生成关键帧。 */
  build: (base: PresetChannels) => Keyframe[]
}

import type { Keyframe } from './keyframes'

/**
 * 预设动画库（纯数据 / 纯函数）。每个预设按元素「当前基础样式」生成扁平关键帧
 * （而非写死绝对值），分为进入 / 退出 / 强调三类。利用 modern-canvas Animation 的
 * 两端填充特性：进入动画收尾停在基础值、退出动画收尾保持终值，无需额外 fill 配置。
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

/** 位移类预设的默认位移距离（px）。 */
const SLIDE = 100

export const ANIMATION_PRESETS: AnimationPreset[] = [
  // ── 进入 ──
  {
    id: 'fadeIn',
    category: 'in',
    duration: 500,
    build: b => [
      { offset: 0, opacity: 0, easing: 'ease-out' },
      { offset: 1, opacity: b.opacity },
    ],
  },
  {
    id: 'slideInLeft',
    category: 'in',
    duration: 500,
    build: b => [
      { offset: 0, left: b.left - SLIDE, opacity: 0, easing: 'ease-out' },
      { offset: 1, left: b.left, opacity: b.opacity },
    ],
  },
  {
    id: 'slideInRight',
    category: 'in',
    duration: 500,
    build: b => [
      { offset: 0, left: b.left + SLIDE, opacity: 0, easing: 'ease-out' },
      { offset: 1, left: b.left, opacity: b.opacity },
    ],
  },
  {
    id: 'slideInUp',
    category: 'in',
    duration: 500,
    build: b => [
      { offset: 0, top: b.top + SLIDE, opacity: 0, easing: 'ease-out' },
      { offset: 1, top: b.top, opacity: b.opacity },
    ],
  },
  {
    id: 'slideInDown',
    category: 'in',
    duration: 500,
    build: b => [
      { offset: 0, top: b.top - SLIDE, opacity: 0, easing: 'ease-out' },
      { offset: 1, top: b.top, opacity: b.opacity },
    ],
  },
  {
    id: 'popIn',
    category: 'in',
    duration: 450,
    build: b => [
      { offset: 0, scaleX: b.scaleX * 0.6, scaleY: b.scaleY * 0.6, opacity: 0, easing: 'ease-out' },
      { offset: 1, scaleX: b.scaleX, scaleY: b.scaleY, opacity: b.opacity },
    ],
  },

  // ── 退出 ──
  {
    id: 'fadeOut',
    category: 'out',
    duration: 500,
    build: b => [
      { offset: 0, opacity: b.opacity, easing: 'ease-in' },
      { offset: 1, opacity: 0 },
    ],
  },
  {
    id: 'slideOutDown',
    category: 'out',
    duration: 500,
    build: b => [
      { offset: 0, top: b.top, opacity: b.opacity, easing: 'ease-in' },
      { offset: 1, top: b.top + SLIDE, opacity: 0 },
    ],
  },

  // ── 强调（循环）──
  {
    id: 'pulse',
    category: 'emphasis',
    duration: 800,
    loop: true,
    build: b => [
      { offset: 0, scaleX: b.scaleX, scaleY: b.scaleY, easing: 'ease-in-out' },
      { offset: 0.5, scaleX: b.scaleX * 1.1, scaleY: b.scaleY * 1.1, easing: 'ease-in-out' },
      { offset: 1, scaleX: b.scaleX, scaleY: b.scaleY },
    ],
  },
  {
    id: 'spin',
    category: 'emphasis',
    duration: 1200,
    loop: true,
    build: b => [
      { offset: 0, rotate: b.rotate, easing: 'linear' },
      { offset: 1, rotate: b.rotate + 360 },
    ],
  },
]

export function getPreset(id: string): AnimationPreset | undefined {
  return ANIMATION_PRESETS.find(p => p.id === id)
}

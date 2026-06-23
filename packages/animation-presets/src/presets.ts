import type { AnimationPreset } from 'mce'

/**
 * 内置动画预设库（视觉意图移植自 bigesj 动画库）。分进入 / 退出 / 强调三类。
 *
 * 采用「原始 WAAPI 写法」：关键帧直接用 `transform` / `transformOrigin` 字符串
 * （含 translate3d / scale3d / rotate3d / skew），由 modern-canvas Animation 原样消费。
 * 好处是能表达 skew / transformOrigin 等离散通道表达不了的效果；代价是这些预设
 * **不参与 Lottie 导出与关键帧通道编辑**（那两处只认 left/top/rotate/scaleX/scaleY/opacity 数值通道）。
 *
 * 约定：mce 关键帧 `offset` 必填，故进入态在 offset 0 给「起始（隐藏）态」、offset 1 收敛到基础值
 * （省略 transform 即回到元素自身布局，opacity 用元素自身 b.opacity）；退出态反之；强调态首尾均为基础态以便循环。
 */

export const ANIMATION_PRESETS: AnimationPreset[] = [
  // ───────────────────────── 进入 ─────────────────────────
  {
    id: 'fadeIn',
    category: 'in',
    duration: 500,
    build: b => [
      { offset: 0, opacity: 0 },
      { offset: 1, opacity: b.opacity },
    ],
  },
  {
    id: 'zoomIn',
    category: 'in',
    duration: 500,
    build: b => [
      { offset: 0, opacity: 0, transform: 'scale(0.3)' },
      { offset: 0.5, opacity: b.opacity },
      { offset: 1, opacity: b.opacity },
    ],
  },
  {
    id: 'brakeIn',
    category: 'in',
    duration: 600,
    build: b => [
      { offset: 0, opacity: 0, transform: 'translate3d(100%,0,0) skewX(-30deg)' },
      { offset: 0.6, opacity: b.opacity, transform: 'skewX(20deg)' },
      { offset: 0.8, opacity: b.opacity, transform: 'skewX(-5deg)' },
      { offset: 1, opacity: b.opacity },
    ],
  },
  {
    id: 'rotateIn',
    category: 'in',
    duration: 500,
    build: b => [
      { offset: 0, opacity: 0, transform: 'rotate(-200deg)' },
      { offset: 1, opacity: b.opacity },
    ],
  },
  {
    id: 'rollIn',
    category: 'in',
    duration: 600,
    build: b => [
      { offset: 0, opacity: 0, transform: 'translate3d(-100%, 0, 0) rotate3d(0, 0, 1, -120deg)' },
      { offset: 1, opacity: b.opacity },
    ],
  },
  {
    id: 'bounceZoomIn',
    category: 'in',
    duration: 700,
    build: b => [
      { offset: 0, opacity: 0, transform: 'scale3d(0.3, 0.3, 0.3)' },
      { offset: 0.2, opacity: 0.2, transform: 'scale3d(1.1, 1.1, 1.1)' },
      { offset: 0.4, opacity: 0.4, transform: 'scale3d(0.9, 0.9, 0.9)' },
      { offset: 0.6, transform: 'scale3d(1.03, 1.03, 1.03)' },
      { offset: 0.8, transform: 'scale3d(0.97, 0.97, 0.97)' },
      { offset: 1, opacity: b.opacity, transform: 'scale3d(1, 1, 1)' },
    ],
  },
  {
    id: 'bounceShrinkIn',
    category: 'in',
    duration: 600,
    build: b => [
      { offset: 0, opacity: 0, transform: 'scale3d(1.7, 1.7, 1.7)' },
      { offset: 0.5, transform: 'scale3d(0.95, 0.95, 0.95)' },
      { offset: 0.8, transform: 'scale3d(1.05, 1.05, 1.05)' },
      { offset: 0.9, transform: 'scale3d(0.98, 0.98, 0.98)' },
      { offset: 1, opacity: b.opacity },
    ],
  },
  {
    id: 'fadeInUp',
    category: 'in',
    duration: 500,
    build: b => [
      { offset: 0, opacity: 0, transform: 'translate3d(0, 50%, 0)' },
      { offset: 1, opacity: b.opacity },
    ],
  },
  {
    id: 'fadeInDown',
    category: 'in',
    duration: 500,
    build: b => [
      { offset: 0, opacity: 0, transform: 'translate3d(0, -50%, 0)' },
      { offset: 1, opacity: b.opacity },
    ],
  },
  {
    id: 'fadeInLeft',
    category: 'in',
    duration: 500,
    build: b => [
      { offset: 0, opacity: 0, transform: 'translate3d(50%, 0, 0)' },
      { offset: 1, opacity: b.opacity },
    ],
  },
  {
    id: 'fadeInRight',
    category: 'in',
    duration: 500,
    build: b => [
      { offset: 0, opacity: 0, transform: 'translate3d(-50%, 0, 0)' },
      { offset: 1, opacity: b.opacity },
    ],
  },
  {
    id: 'flyInUp',
    category: 'in',
    duration: 600,
    build: b => [
      { offset: 0, opacity: 0, transform: 'translate3d(0, 100%, 0)' },
      { offset: 1, opacity: b.opacity },
    ],
  },
  {
    id: 'flyInDown',
    category: 'in',
    duration: 600,
    build: b => [
      { offset: 0, opacity: 0, transform: 'translate3d(0, -100%, 0)' },
      { offset: 1, opacity: b.opacity },
    ],
  },
  {
    id: 'flyInLeft',
    category: 'in',
    duration: 600,
    build: b => [
      { offset: 0, opacity: 0, transform: 'translate3d(100%, 0, 0)' },
      { offset: 1, opacity: b.opacity },
    ],
  },
  {
    id: 'flyInRight',
    category: 'in',
    duration: 600,
    build: b => [
      { offset: 0, opacity: 0, transform: 'translate3d(-100%, 0, 0)' },
      { offset: 1, opacity: b.opacity },
    ],
  },
  {
    id: 'bounceInUp',
    category: 'in',
    duration: 700,
    build: b => [
      { offset: 0, opacity: 0, transform: 'translate3d(0, 100%, 0)' },
      { offset: 0.6, opacity: b.opacity, transform: 'translate3d(0, -25px, 0)' },
      { offset: 0.75, transform: 'translate3d(0, 10px, 0)' },
      { offset: 0.9, transform: 'translate3d(0, -5px, 0)' },
      { offset: 1, opacity: b.opacity, transform: 'translate3d(0, 0, 0)' },
    ],
  },
  {
    id: 'bounceInDown',
    category: 'in',
    duration: 700,
    build: b => [
      { offset: 0, opacity: 0, transform: 'translate3d(0, -100%, 0)' },
      { offset: 0.6, opacity: b.opacity, transform: 'translate3d(0, 25px, 0)' },
      { offset: 0.75, transform: 'translate3d(0, -10px, 0)' },
      { offset: 0.9, transform: 'translate3d(0, 5px, 0)' },
      { offset: 1, opacity: b.opacity, transform: 'translate3d(0, 0, 0)' },
    ],
  },
  {
    id: 'bounceInLeft',
    category: 'in',
    duration: 700,
    build: b => [
      { offset: 0, opacity: 0, transform: 'translate3d(100%, 0, 0)' },
      { offset: 0.6, opacity: b.opacity, transform: 'translate3d(-25px, 0, 0)' },
      { offset: 0.75, transform: 'translate3d(10px, 0, 0)' },
      { offset: 0.9, transform: 'translate3d(-5px, 0, 0)' },
      { offset: 1, opacity: b.opacity, transform: 'translate3d(0, 0, 0)' },
    ],
  },
  {
    id: 'bounceInRight',
    category: 'in',
    duration: 700,
    build: b => [
      { offset: 0, opacity: 0, transform: 'translate3d(-100%, 0, 0)' },
      { offset: 0.6, opacity: b.opacity, transform: 'translate3d(25px, 0, 0)' },
      { offset: 0.75, transform: 'translate3d(-10px, 0, 0)' },
      { offset: 0.9, transform: 'translate3d(5px, 0, 0)' },
      { offset: 1, opacity: b.opacity, transform: 'translate3d(0, 0, 0)' },
    ],
  },
  {
    id: 'unfoldUp',
    category: 'in',
    duration: 500,
    build: b => [
      { offset: 0, opacity: 0, transformOrigin: 'center bottom', transform: 'scaleY(0.1)' },
      { offset: 0.4, opacity: b.opacity, transformOrigin: 'center bottom', transform: 'scaleY(1.02)' },
      { offset: 0.6, transformOrigin: 'center bottom', transform: 'scaleY(0.98)' },
      { offset: 0.8, transformOrigin: 'center bottom', transform: 'scaleY(1.01)' },
      { offset: 1, opacity: b.opacity },
    ],
  },
  {
    id: 'unfoldDown',
    category: 'in',
    duration: 500,
    build: b => [
      { offset: 0, opacity: 0, transformOrigin: 'center top', transform: 'scaleY(0.1)' },
      { offset: 0.4, opacity: b.opacity, transformOrigin: 'center top', transform: 'scaleY(1.02)' },
      { offset: 0.6, transformOrigin: 'center top', transform: 'scaleY(0.98)' },
      { offset: 0.8, transformOrigin: 'center top', transform: 'scaleY(1.01)' },
      { offset: 1, opacity: b.opacity },
    ],
  },
  {
    id: 'unfoldLeft',
    category: 'in',
    duration: 500,
    build: b => [
      { offset: 0, opacity: 0, transformOrigin: 'right center', transform: 'scaleX(0.1)' },
      { offset: 0.4, opacity: b.opacity, transformOrigin: 'right center', transform: 'scaleX(1.02)' },
      { offset: 0.6, transformOrigin: 'right center', transform: 'scaleX(0.98)' },
      { offset: 0.8, transformOrigin: 'right center', transform: 'scaleX(1.01)' },
      { offset: 1, opacity: b.opacity },
    ],
  },
  {
    id: 'unfoldRight',
    category: 'in',
    duration: 500,
    build: b => [
      { offset: 0, opacity: 0, transformOrigin: 'left center', transform: 'scaleX(0.1)' },
      { offset: 0.4, opacity: b.opacity, transformOrigin: 'left center', transform: 'scaleX(1.02)' },
      { offset: 0.6, transformOrigin: 'left center', transform: 'scaleX(0.98)' },
      { offset: 0.8, transformOrigin: 'left center', transform: 'scaleX(1.01)' },
      { offset: 1, opacity: b.opacity },
    ],
  },
  {
    id: 'zoomInUp',
    category: 'in',
    duration: 600,
    build: b => [
      { offset: 0, opacity: 0, transform: 'scale3d(0.1, 0.1, 0.1) translate3d(0, 500%, 0)' },
      { offset: 0.6, opacity: b.opacity, transform: 'scale3d(0.475, 0.475, 0.475) translate3d(0, -60%, 0)' },
      { offset: 1, opacity: b.opacity },
    ],
  },
  {
    id: 'zoomInDown',
    category: 'in',
    duration: 600,
    build: b => [
      { offset: 0, opacity: 0, transform: 'scale3d(0.1, 0.1, 0.1) translate3d(0, -500%, 0)' },
      { offset: 0.6, opacity: b.opacity, transform: 'scale3d(0.475, 0.475, 0.475) translate3d(0, 60%, 0)' },
      { offset: 1, opacity: b.opacity },
    ],
  },
  {
    id: 'zoomInLeft',
    category: 'in',
    duration: 600,
    build: b => [
      { offset: 0, opacity: 0, transform: 'scale3d(0.1, 0.1, 0.1) translate3d(500%, 0, 0)' },
      { offset: 0.6, opacity: b.opacity, transform: 'scale3d(0.475, 0.475, 0.475) translate3d(-60%, 0, 0)' },
      { offset: 1, opacity: b.opacity },
    ],
  },
  {
    id: 'zoomInRight',
    category: 'in',
    duration: 600,
    build: b => [
      { offset: 0, opacity: 0, transform: 'scale3d(0.1, 0.1, 0.1) translate3d(-500%, 0, 0)' },
      { offset: 0.6, opacity: b.opacity, transform: 'scale3d(0.475, 0.475, 0.475) translate3d(60%, 0, 0)' },
      { offset: 1, opacity: b.opacity },
    ],
  },
  {
    id: 'rotateInTopLeft',
    category: 'in',
    duration: 500,
    build: b => [
      { offset: 0, opacity: 0, transformOrigin: 'left bottom', transform: 'rotate3d(0, 0, 1, -45deg)' },
      { offset: 1, opacity: b.opacity },
    ],
  },
  {
    id: 'rotateInTopRight',
    category: 'in',
    duration: 500,
    build: b => [
      { offset: 0, opacity: 0, transformOrigin: 'right bottom', transform: 'rotate3d(0, 0, 1, 45deg)' },
      { offset: 1, opacity: b.opacity },
    ],
  },
  {
    id: 'rotateInBottomLeft',
    category: 'in',
    duration: 500,
    build: b => [
      { offset: 0, opacity: 0, transformOrigin: 'left bottom', transform: 'rotate3d(0, 0, 1, 45deg)' },
      { offset: 1, opacity: b.opacity },
    ],
  },
  {
    id: 'rotateInBottomRight',
    category: 'in',
    duration: 500,
    build: b => [
      { offset: 0, opacity: 0, transformOrigin: 'right bottom', transform: 'rotate3d(0, 0, 1, -45deg)' },
      { offset: 1, opacity: b.opacity },
    ],
  },

  // ──────────────────────── 强调（循环）────────────────────────
  {
    id: 'bounce',
    category: 'emphasis',
    duration: 1000,
    loop: true,
    build: () => [
      { offset: 0, transformOrigin: 'center center', transform: 'translate3d(0,0,0)' },
      { offset: 0.2, transform: 'translate3d(0,0,0)' },
      { offset: 0.4, transform: 'translate3d(0,-30px,0)' },
      { offset: 0.5, transform: 'translate3d(0,0,0)' },
      { offset: 0.7, transform: 'translate3d(0,-15px,0)' },
      { offset: 0.8, transform: 'translate3d(0,0,0)' },
      { offset: 0.9, transform: 'translate3d(0,-4px,0)' },
      { offset: 1, transform: 'translate3d(0,0,0)' },
    ],
  },
  {
    id: 'flash',
    category: 'emphasis',
    duration: 1000,
    loop: true,
    build: b => [
      { offset: 0, opacity: b.opacity },
      { offset: 0.25, opacity: 0 },
      { offset: 0.5, opacity: b.opacity },
      { offset: 0.75, opacity: 0 },
      { offset: 1, opacity: b.opacity },
    ],
  },
  {
    id: 'pulse',
    category: 'emphasis',
    duration: 800,
    loop: true,
    build: () => [
      { offset: 0, transformOrigin: 'center center', transform: 'scale3d(1, 1, 1)' },
      { offset: 0.25, transform: 'scale3d(1.1, 1.1, 1.1)' },
      { offset: 0.5, transform: 'scale3d(1, 1, 1)' },
      { offset: 0.75, transform: 'scale3d(1.1, 1.1, 1.1)' },
      { offset: 1, transform: 'scale3d(1, 1, 1)' },
    ],
  },
  {
    id: 'rubberBand',
    category: 'emphasis',
    duration: 900,
    loop: true,
    build: () => [
      { offset: 0, transformOrigin: 'center center', transform: 'scale3d(1, 1, 1)' },
      { offset: 0.4, transform: 'scale3d(0.75, 1.25, 1)' },
      { offset: 0.5, transform: 'scale3d(1.15, 0.75, 1)' },
      { offset: 0.65, transform: 'scale3d(.95, 1.05, 1)' },
      { offset: 0.75, transform: 'scale3d(1.05, .95, 1)' },
      { offset: 1, transform: 'scale3d(1, 1, 1)' },
    ],
  },
  {
    id: 'shake',
    category: 'emphasis',
    duration: 800,
    loop: true,
    build: () => [
      { offset: 0, transformOrigin: 'center center', transform: 'translate3d(0,0,0)' },
      { offset: 0.1, transform: 'translate3d(-10px,0,0)' },
      { offset: 0.2, transform: 'translate3d(10px,0,0)' },
      { offset: 0.3, transform: 'translate3d(-10px,0,0)' },
      { offset: 0.4, transform: 'translate3d(10px,0,0)' },
      { offset: 0.5, transform: 'translate3d(-10px,0,0)' },
      { offset: 0.6, transform: 'translate3d(10px,0,0)' },
      { offset: 0.7, transform: 'translate3d(-10px,0,0)' },
      { offset: 0.8, transform: 'translate3d(10px,0,0)' },
      { offset: 0.9, transform: 'translate3d(-10px,0,0)' },
      { offset: 1, transform: 'translate3d(0,0,0)' },
    ],
  },
  {
    id: 'wobble',
    category: 'emphasis',
    duration: 1000,
    loop: true,
    build: () => [
      { offset: 0, transformOrigin: 'center center' },
      { offset: 0.15, transform: 'translate3d(-25%, 0, 0) rotate3d(0, 0, 1, -5deg)' },
      { offset: 0.3, transform: 'translate3d(20%, 0, 0) rotate3d(0, 0, 1, 3deg)' },
      { offset: 0.45, transform: 'translate3d(-15%, 0, 0) rotate3d(0, 0, 1, -3deg)' },
      { offset: 0.6, transform: 'translate3d(10%, 0, 0) rotate3d(0, 0, 1, 2deg)' },
      { offset: 0.75, transform: 'translate3d(-5%, 0, 0) rotate3d(0, 0, 1, -1deg)' },
      { offset: 1, transform: 'translate3d(0, 0, 0)' },
    ],
  },
  {
    id: 'tada',
    category: 'emphasis',
    duration: 1000,
    loop: true,
    build: () => [
      { offset: 0, transformOrigin: 'center center', transform: 'scale3d(1, 1, 1)' },
      { offset: 0.1, transform: 'scale3d(.9, .9, .9) rotate3d(0, 0, 1, -3deg)' },
      { offset: 0.2, transform: 'scale3d(.9, .9, .9) rotate3d(0, 0, 1, -3deg)' },
      { offset: 0.3, transform: 'scale3d(1.1, 1.1, 1.1) rotate3d(0, 0, 1, 3deg)' },
      { offset: 0.4, transform: 'scale3d(1.1, 1.1, 1.1) rotate3d(0, 0, 1, -3deg)' },
      { offset: 0.5, transform: 'scale3d(1.1, 1.1, 1.1) rotate3d(0, 0, 1, 3deg)' },
      { offset: 0.6, transform: 'scale3d(1.1, 1.1, 1.1) rotate3d(0, 0, 1, -3deg)' },
      { offset: 0.7, transform: 'scale3d(1.1, 1.1, 1.1) rotate3d(0, 0, 1, 3deg)' },
      { offset: 0.8, transform: 'scale3d(1.1, 1.1, 1.1) rotate3d(0, 0, 1, -3deg)' },
      { offset: 0.9, transform: 'scale3d(1.1, 1.1, 1.1) rotate3d(0, 0, 1, 3deg)' },
      { offset: 1, transform: 'scale3d(1, 1, 1)' },
    ],
  },
  {
    id: 'swing',
    category: 'emphasis',
    duration: 900,
    loop: true,
    build: () => [
      { offset: 0, transformOrigin: 'center center', transform: 'rotate3d(0, 0, 1, 0)' },
      { offset: 0.2, transform: 'rotate3d(0, 0, 1, 15deg)' },
      { offset: 0.4, transform: 'rotate3d(0, 0, 1, -10deg)' },
      { offset: 0.6, transform: 'rotate3d(0, 0, 1, 5deg)' },
      { offset: 0.8, transform: 'rotate3d(0, 0, 1, -5deg)' },
      { offset: 1, transform: 'rotate3d(0, 0, 1, 0)' },
    ],
  },
  {
    id: 'jelly',
    category: 'emphasis',
    duration: 1000,
    loop: true,
    build: () => [
      { offset: 0, transformOrigin: 'center center' },
      { offset: 0.11, transform: 'skewX(0deg) skewY(0deg)' },
      { offset: 0.22, transform: 'skewX(-12.5deg) skewY(-12.5deg)' },
      { offset: 0.33, transform: 'skewX(6.25deg) skewY(6.25deg)' },
      { offset: 0.44, transform: 'skewX(-3.125deg) skewY(-3.125deg)' },
      { offset: 0.55, transform: 'skewX(1.5625deg) skewY(1.5625deg)' },
      { offset: 0.66, transform: 'skewX(-0.78125deg) skewY(-0.78125deg)' },
      { offset: 0.77, transform: 'skewX(0.390625deg) skewY(0.390625deg)' },
      { offset: 0.88, transform: 'skewX(-0.1953125deg) skewY(-0.1953125deg)' },
      { offset: 1, transform: 'skewX(0deg) skewY(0deg)' },
    ],
  },
  {
    id: 'spin',
    category: 'emphasis',
    duration: 1200,
    loop: true,
    build: () => [
      { offset: 0, transformOrigin: 'center center', transform: 'rotate(0deg)', easing: 'linear' },
      { offset: 1, transform: 'rotate(-360deg)' },
    ],
  },
  {
    id: 'spinReverse',
    category: 'emphasis',
    duration: 1200,
    loop: true,
    build: () => [
      { offset: 0, transformOrigin: 'center center', transform: 'rotate(0deg)', easing: 'linear' },
      { offset: 1, transform: 'rotate(360deg)' },
    ],
  },
  {
    id: 'panUp',
    category: 'emphasis',
    duration: 1000,
    loop: true,
    build: () => [
      { offset: 0, transformOrigin: 'left top', transform: 'translateY(0)' },
      { offset: 0.3, transform: 'translateY(100%)' },
      { offset: 1, transform: 'translateY(100%)' },
    ],
  },
  {
    id: 'panDown',
    category: 'emphasis',
    duration: 1000,
    loop: true,
    build: () => [
      { offset: 0, transformOrigin: 'left top', transform: 'translateY(0)' },
      { offset: 0.3, transform: 'translateY(-100%)' },
      { offset: 1, transform: 'translateY(-100%)' },
    ],
  },
  {
    id: 'panLeft',
    category: 'emphasis',
    duration: 1000,
    loop: true,
    build: () => [
      { offset: 0, transformOrigin: 'center bottom', transform: 'translateX(0)' },
      { offset: 0.3, transform: 'translateX(100%)' },
      { offset: 1, transform: 'translateX(100%)' },
    ],
  },
  {
    id: 'panRight',
    category: 'emphasis',
    duration: 1000,
    loop: true,
    build: () => [
      { offset: 0, transformOrigin: 'center bottom', transform: 'translateX(0)' },
      { offset: 0.3, transform: 'translateX(-100%)' },
      { offset: 1, transform: 'translateX(-100%)' },
    ],
  },

  // ───────────────────────── 退出 ─────────────────────────
  {
    id: 'disappear',
    category: 'out',
    duration: 400,
    build: b => [
      { offset: 0, opacity: b.opacity },
      { offset: 0.1, opacity: 0 },
      { offset: 1, opacity: 0 },
    ],
  },
  {
    id: 'fadeOut',
    category: 'out',
    duration: 500,
    build: b => [
      { offset: 0, opacity: b.opacity },
      { offset: 1, opacity: 0 },
    ],
  },
  {
    id: 'bounceOut',
    category: 'out',
    duration: 600,
    build: b => [
      { offset: 0, opacity: b.opacity, transform: 'scale3d(1, 1, 1)' },
      { offset: 0.2, transform: 'scale3d(.9, .9, .9)' },
      { offset: 0.5, transform: 'scale3d(1.2, 1.2, 1.2)' },
      { offset: 0.55, transform: 'scale3d(1.2, 1.2, 1.2)' },
      { offset: 1, opacity: 0, transform: 'scale3d(.3, .3, .3)' },
    ],
  },
  {
    id: 'zoomOut',
    category: 'out',
    duration: 500,
    build: b => [
      { offset: 0, opacity: b.opacity },
      { offset: 1, opacity: 0, transform: 'scale(0.3)' },
    ],
  },
  {
    id: 'rotateOut',
    category: 'out',
    duration: 500,
    build: b => [
      { offset: 0, opacity: b.opacity, transform: 'rotate(0deg)' },
      { offset: 1, opacity: 0, transform: 'rotate(-360deg)' },
    ],
  },
  {
    id: 'hinge',
    category: 'out',
    duration: 900,
    build: b => [
      { offset: 0, opacity: b.opacity, transformOrigin: 'left top' },
      { offset: 0.2, transformOrigin: 'left top', transform: 'rotate3d(0, 0, 1, 80deg)' },
      { offset: 0.4, transformOrigin: 'left top', transform: 'rotate3d(0, 0, 1, 60deg)' },
      { offset: 0.6, transformOrigin: 'left top', transform: 'rotate3d(0, 0, 1, 80deg)' },
      { offset: 0.8, transformOrigin: 'left top', transform: 'rotate3d(0, 0, 1, 60deg)' },
      { offset: 1, opacity: 0, transformOrigin: 'left top', transform: 'translate3d(0, 700px, 0)' },
    ],
  },
  {
    id: 'lightSpeedOut',
    category: 'out',
    duration: 500,
    build: b => [
      { offset: 0, opacity: b.opacity },
      { offset: 1, opacity: 0, transform: 'translate3d(100%, 0, 0) skewX(30deg)' },
    ],
  },
  {
    id: 'rollOut',
    category: 'out',
    duration: 600,
    build: b => [
      { offset: 0, opacity: b.opacity },
      { offset: 1, opacity: 0, transform: 'translate3d(100%, 0, 0) rotate3d(0, 0, 1, 120deg)' },
    ],
  },
  {
    id: 'fadeOutUp',
    category: 'out',
    duration: 500,
    build: b => [
      { offset: 0, opacity: b.opacity },
      { offset: 1, opacity: 0, transform: 'translate3d(0, -100%, 0)' },
    ],
  },
  {
    id: 'fadeOutDown',
    category: 'out',
    duration: 500,
    build: b => [
      { offset: 0, opacity: b.opacity },
      { offset: 1, opacity: 0, transform: 'translate3d(0, 100%, 0)' },
    ],
  },
  {
    id: 'fadeOutLeft',
    category: 'out',
    duration: 500,
    build: b => [
      { offset: 0, opacity: b.opacity },
      { offset: 1, opacity: 0, transform: 'translate3d(-100%, 0, 0)' },
    ],
  },
  {
    id: 'fadeOutRight',
    category: 'out',
    duration: 500,
    build: b => [
      { offset: 0, opacity: b.opacity },
      { offset: 1, opacity: 0, transform: 'translate3d(100%, 0, 0)' },
    ],
  },
  {
    id: 'flyOutUp',
    category: 'out',
    duration: 600,
    build: b => [
      { offset: 0, opacity: b.opacity },
      { offset: 1, opacity: 0, transform: 'translate3d(0, -2000px, 0)' },
    ],
  },
  {
    id: 'flyOutDown',
    category: 'out',
    duration: 600,
    build: b => [
      { offset: 0, opacity: b.opacity },
      { offset: 1, opacity: 0, transform: 'translate3d(0, 2000px, 0)' },
    ],
  },
  {
    id: 'flyOutLeft',
    category: 'out',
    duration: 600,
    build: b => [
      { offset: 0, opacity: b.opacity },
      { offset: 1, opacity: 0, transform: 'translate3d(-2000px, 0, 0)' },
    ],
  },
  {
    id: 'flyOutRight',
    category: 'out',
    duration: 600,
    build: b => [
      { offset: 0, opacity: b.opacity },
      { offset: 1, opacity: 0, transform: 'translate3d(2000px, 0, 0)' },
    ],
  },
  {
    id: 'bounceOutUp',
    category: 'out',
    duration: 700,
    build: b => [
      { offset: 0, opacity: b.opacity, transform: 'translate3d(0, 0, 0)' },
      { offset: 0.2, transform: 'translate3d(0, -20px, 0)' },
      { offset: 0.4, transform: 'translate3d(0, 20px, 0)' },
      { offset: 0.45, transform: 'translate3d(0, 20px, 0)' },
      { offset: 1, opacity: 0, transform: 'translate3d(0, -2000px, 0)' },
    ],
  },
  {
    id: 'bounceOutDown',
    category: 'out',
    duration: 700,
    build: b => [
      { offset: 0, opacity: b.opacity, transform: 'translate3d(0, 0, 0)' },
      { offset: 0.2, transform: 'translate3d(0, 20px, 0)' },
      { offset: 0.4, transform: 'translate3d(0, -20px, 0)' },
      { offset: 0.45, transform: 'translate3d(0, -20px, 0)' },
      { offset: 1, opacity: 0, transform: 'translate3d(0, 2000px, 0)' },
    ],
  },
  {
    id: 'bounceOutLeft',
    category: 'out',
    duration: 700,
    build: b => [
      { offset: 0, opacity: b.opacity, transform: 'translate3d(0, 0, 0)' },
      { offset: 0.2, transform: 'translate3d(-20px, 0, 0)' },
      { offset: 0.4, transform: 'translate3d(20px, 0, 0)' },
      { offset: 0.45, transform: 'translate3d(20px, 0, 0)' },
      { offset: 1, opacity: 0, transform: 'translate3d(-2000px, 0, 0)' },
    ],
  },
  {
    id: 'bounceOutRight',
    category: 'out',
    duration: 700,
    build: b => [
      { offset: 0, opacity: b.opacity, transform: 'translate3d(0, 0, 0)' },
      { offset: 0.2, transform: 'translate3d(20px, 0, 0)' },
      { offset: 0.4, transform: 'translate3d(-20px, 0, 0)' },
      { offset: 0.45, transform: 'translate3d(-20px, 0, 0)' },
      { offset: 1, opacity: 0, transform: 'translate3d(2000px, 0, 0)' },
    ],
  },
  {
    id: 'rotateOutTopRight',
    category: 'out',
    duration: 500,
    build: b => [
      { offset: 0, opacity: b.opacity, transformOrigin: 'right bottom', transform: 'rotate3d(0, 0, 1, 0)' },
      { offset: 1, opacity: 0, transformOrigin: 'right bottom', transform: 'rotate3d(0, 0, 1, 90deg)' },
    ],
  },
  {
    id: 'rotateOutTopLeft',
    category: 'out',
    duration: 500,
    build: b => [
      { offset: 0, opacity: b.opacity, transformOrigin: 'left bottom', transform: 'rotate3d(0, 0, 1, 0)' },
      { offset: 1, opacity: 0, transformOrigin: 'left bottom', transform: 'rotate3d(0, 0, 1, -90deg)' },
    ],
  },
  {
    id: 'rotateOutBottomLeft',
    category: 'out',
    duration: 500,
    build: b => [
      { offset: 0, opacity: b.opacity, transformOrigin: 'right bottom', transform: 'rotate3d(0, 0, 1, 0)' },
      { offset: 1, opacity: 0, transformOrigin: 'right bottom', transform: 'rotate3d(0, 0, 1, -90deg)' },
    ],
  },
  {
    id: 'rotateOutBottomRight',
    category: 'out',
    duration: 500,
    build: b => [
      { offset: 0, opacity: b.opacity, transformOrigin: 'left bottom', transform: 'rotate3d(0, 0, 1, 0)' },
      { offset: 1, opacity: 0, transformOrigin: 'left bottom', transform: 'rotate3d(0, 0, 1, 90deg)' },
    ],
  },
  {
    id: 'zoomOutUp',
    category: 'out',
    duration: 600,
    build: b => [
      { offset: 0, opacity: b.opacity, transform: 'scale3d(1, 1, 1) translate3d(0, 0, 0)' },
      { offset: 0.4, transform: 'scale3d(.475, .475, .475) translate3d(0, 60px, 0)' },
      { offset: 1, opacity: 0, transform: 'scale3d(.1, .1, .1) translate3d(0, -2000px, 0)' },
    ],
  },
  {
    id: 'zoomOutDown',
    category: 'out',
    duration: 600,
    build: b => [
      { offset: 0, opacity: b.opacity, transform: 'scale3d(1, 1, 1) translate3d(0, 0, 0)' },
      { offset: 0.4, transform: 'scale3d(.475, .475, .475) translate3d(0, -60px, 0)' },
      { offset: 1, opacity: 0, transform: 'scale3d(.1, .1, .1) translate3d(0, 2000px, 0)' },
    ],
  },
  {
    id: 'zoomOutLeft',
    category: 'out',
    duration: 600,
    build: b => [
      { offset: 0, opacity: b.opacity, transform: 'scale3d(1, 1, 1) translate3d(0, 0, 0)' },
      { offset: 0.4, transform: 'scale3d(.475, .475, .475) translate3d(42px, 0, 0)' },
      { offset: 1, opacity: 0, transform: 'scale3d(.1, .1, .1) translate3d(-2000px, 0, 0)' },
    ],
  },
  {
    id: 'zoomOutRight',
    category: 'out',
    duration: 600,
    build: b => [
      { offset: 0, opacity: b.opacity, transform: 'scale3d(1, 1, 1) translate3d(0, 0, 0)' },
      { offset: 0.4, transform: 'scale3d(.475, .475, .475) translate3d(-42px, 0, 0)' },
      { offset: 1, opacity: 0, transform: 'scale3d(.1, .1, .1) translate3d(2000px, 0, 0)' },
    ],
  },
]

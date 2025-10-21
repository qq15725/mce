import { idGenerator } from 'modern-idoc'

const animations = {
  easing: {
    匀速: 'linear',
    加速: 'cubic-bezier(0.55, 0, 1, 0.45)',
    减速: 'cubic-bezier(0, 0.55, 0.45, 1)',
  } as Record<string, string>,
  textIn: {
    上下飞入: [
      [{ opacity: 0, transform: 'translate3d(0, -100%, 0)' }, { opacity: 1 }],
      [{ opacity: 0, transform: 'translate3d(0, 100%, 0)' }, { opacity: 1 }],
    ],
    上下弹跳: [
      [
        { opacity: 0, transform: 'translate3d(0, -100%, 0)' },
        { opacity: 1, transform: 'translate3d(0, 25px, 0)', offset: 0.6 },
        { transform: 'translate3d(0, -10px, 0)', offset: 0.75 },
        { transform: 'translate3d(0, 5px, 0)', offset: 0.9 },
        { opacity: 1, transform: 'translate3d(0, 0, 0)' },
      ],
      [
        { opacity: 0, transform: 'translate3d(0, 100%, 0)' },
        { opacity: 1, transform: 'translate3d(0, -25px, 0)', offset: 0.6 },
        { transform: 'translate3d(0, 10px, 0)', offset: 0.75 },
        { transform: 'translate3d(0, -5px, 0)', offset: 0.9 },
        { opacity: 1, transform: 'translate3d(0, 0, 0)' },
      ],
    ],
    上下放大: [
      [{ opacity: 0, transform: 'scale(0.3) translate3d(0, -100%, 0)' }, { opacity: 1 }],
      [{ opacity: 0, transform: 'scale(0.3) translate3d(0, 100%, 0)' }, { opacity: 1 }],
    ],
    上下旋入: [
      [{ opacity: 0, transformOrigin: 'right bottom', transform: 'rotate3d(0, 0, 1, 45deg)' }, { opacity: 1 }],
      [{ opacity: 0, transformOrigin: 'right bottom', transform: 'rotate3d(0, 0, 1, -45deg)' }, { opacity: 1 }],
    ],
  } as Record<string, Keyframe[][]>,
  in: {
    淡入: [{ opacity: 0 }],
    放大: [
      { opacity: 0, transform: 'scale(0.3)' },
      { opacity: 1, offset: 0.5 },
    ],
    刹车: [
      { opacity: 0, transform: 'translate3d(100%,0,0) skewX(-30deg)' },
      { opacity: 1, transform: 'skewX(20deg)', offset: 0.6 },
      { opacity: 1, transform: 'skewX(-5deg)', offset: 0.8 },
      { opacity: 1 },
    ],
    旋转: [{ opacity: 0, transform: 'rotate(-200deg)' }],
    转入: [{ opacity: 0, transform: 'translate3d(-100%, 0, 0) rotate3d(0, 0, 1, -120deg)' }],
    弹性放大: [
      { opacity: 0, transform: 'scale3d(0.3, 0.3, 0.3)' },
      { opacity: 0.2, transform: 'scale3d(1.1, 1.1, 1.1)', offset: 0.2 },
      { opacity: 0.4, transform: 'scale3d(0.9, 0.9, 0.9)', offset: 0.4 },
      { transform: 'scale3d(1.03, 1.03, 1.03)', offset: 0.6 },
      { transform: 'scale3d(0.97, 0.97, 0.97)', offset: 0.8 },
      { transform: 'scale3d(1, 1, 1)' },
    ],
    弹性缩小: [
      { opacity: 0, transform: 'scale3d(1.7, 1.7, 1.7)' },
      { transform: 'scale3d(0.95, 0.95, 0.95)', offset: 0.5 },
      { transform: 'scale3d(1.05, 1.05, 1.05)', offset: 0.8 },
      { transform: 'scale3d(0.98, 0.98, 0.98)', offset: 0.9 },
    ],
    向上淡入: [{ opacity: 0, transform: 'translate3d(0, 50%, 0)' }],
    向下淡入: [{ opacity: 0, transform: 'translate3d(0, -50%, 0)' }],
    向左淡入: [{ opacity: 0, transform: 'translate3d(50%, 0, 0)' }],
    向右淡入: [{ opacity: 0, transform: 'translate3d(-50%, 0, 0)' }],
    向上飞入: [{ opacity: 0, transform: 'translate3d(0, 100%, 0)' }],
    向下飞入: [{ opacity: 0, transform: 'translate3d(0, -100%, 0)' }],
    向左飞入: [{ opacity: 0, transform: 'translate3d(100%, 0, 0)' }],
    向右飞入: [{ opacity: 0, transform: 'translate3d(-100%, 0, 0)' }],
    向上弹跳: [
      { opacity: 0, transform: 'translate3d(0, 100%, 0)' },
      { transform: 'translate3d(0, -25px, 0)', offset: 0.6 },
      { transform: 'translate3d(0, 10px, 0)', offset: 0.75 },
      { transform: 'translate3d(0, -5px, 0)', offset: 0.9 },
      { transform: 'translate3d(0, 0, 0)' },
    ],
    向下弹跳: [
      { opacity: 0, transform: 'translate3d(0, -100%, 0)' },
      { transform: 'translate3d(0, 25px, 0)', offset: 0.6 },
      { transform: 'translate3d(0, -10px, 0)', offset: 0.75 },
      { transform: 'translate3d(0, 5px, 0)', offset: 0.9 },
      { transform: 'translate3d(0, 0, 0)' },
    ],
    向左弹跳: [
      { opacity: 0, transform: 'translate3d(100%, 0, 0)' },
      { transform: 'translate3d(-25px, 0, 0)', offset: 0.6 },
      { transform: 'translate3d(10px, 0, 0)', offset: 0.75 },
      { transform: 'translate3d(-5px, 0, 0)', offset: 0.9 },
      { transform: 'translate3d(0, 0, 0)' },
    ],
    向右弹跳: [
      { opacity: 0, transform: 'translate3d(-100%, 0, 0)' },
      { transform: 'translate3d(25px, 0, 0)', offset: 0.6 },
      { transform: 'translate3d(-10px, 0, 0)', offset: 0.75 },
      { transform: 'translate3d(5px, 0, 0)', offset: 0.9 },
      { transform: 'translate3d(0, 0, 0)' },
    ],
    向上展开: [
      { opacity: 0, transformOrigin: 'center bottom', transform: 'scaleY(0.1)' },
      { transform: 'scaleY(1.02)', offset: 0.4 },
      { transform: 'scaleY(0.98)', offset: 0.6 },
      { transform: 'scaleY(1.01)', offset: 0.8 },
    ],
    向下展开: [
      { opacity: 0, transformOrigin: 'center top', transform: 'scaleY(0.1)' },
      { transform: 'scaleY(1.02)', offset: 0.4 },
      { transform: 'scaleY(0.98)', offset: 0.6 },
      { transform: 'scaleY(1.01)', offset: 0.8 },
    ],
    向左展开: [
      { opacity: 0, transformOrigin: 'right center', transform: 'scaleX(0.1)' },
      { transform: 'scaleX(1.02)', offset: 0.4 },
      { transform: 'scaleX(0.98)', offset: 0.6 },
      { transform: 'scaleX(1.01)', offset: 0.8 },
    ],
    向右展开: [
      { opacity: 0, transformOrigin: 'left center', transform: 'scaleX(0.1)' },
      { transform: 'scaleX(1.02)', offset: 0.4 },
      { transform: 'scaleX(0.98)', offset: 0.6 },
      { transform: 'scaleX(1.01)', offset: 0.8 },
    ],
    向上放大: [
      { opacity: 0, transform: 'scale3d(0.1, 0.1, 0.1) translate3d(0, 500%, 0)' },
      { transform: 'scale3d(0.475, 0.475, 0.475) translate3d(0, -60%, 0)', offset: 0.6 },
    ],
    向下放大: [
      { opacity: 0, transform: 'scale3d(0.1, 0.1, 0.1) translate3d(0, -500%, 0)' },
      { transform: 'scale3d(0.475, 0.475, 0.475) translate3d(0, 60%, 0)', offset: 0.6 },
    ],
    向左放大: [
      { opacity: 0, transform: 'scale3d(0.1, 0.1, 0.1) translate3d(500%, 0, 0)' },
      { transform: 'scale3d(0.475, 0.475, 0.475) translate3d(-60%, 0, 0)', offset: 0.6 },
    ],
    向右放大: [
      { opacity: 0, transform: 'scale3d(0.1, 0.1, 0.1) translate3d(-500%, 0, 0)' },
      { transform: 'scale3d(0.475, 0.475, 0.475) translate3d(60%, 0, 0)', offset: 0.6 },
    ],
    左上旋入: [{ opacity: 0, transformOrigin: 'left bottom', transform: 'rotate3d(0, 0, 1, -45deg)' }],
    右上旋入: [{ opacity: 0, transformOrigin: 'right bottom', transform: 'rotate3d(0, 0, 1, 45deg)' }],
    左下旋入: [{ opacity: 0, transformOrigin: 'left bottom', transform: 'rotate3d(0, 0, 1, 45deg)' }],
    右下旋入: [{ opacity: 0, transformOrigin: 'right bottom', transform: 'rotate3d(0, 0, 1, -45deg)' }],
  } as Record<string, Keyframe[]>,
  stay: {
    弹跳: [
      { transformOrigin: 'center center', transform: 'translate3d(0,0,0)' },
      { transform: 'translate3d(0,0,0)', offset: 0.2 },
      { transform: 'translate3d(0,-30px,0)', offset: 0.4 },
      { transform: 'translate3d(0,0,0)', offset: 0.5 },
      { transform: 'translate3d(0,-15px,0)', offset: 0.7 },
      { transform: 'translate3d(0,0,0)', offset: 0.8 },
      { transform: 'translate3d(0,-4px,0)', offset: 0.9 },
      { transform: 'translate3d(0,0,0)' },
    ],
    闪现: [
      { opacity: null },
      { opacity: 0, offset: 0.25 },
      { opacity: null, offset: 0.5 },
      { opacity: 0, offset: 0.75 },
      { opacity: null },
    ],
    脉冲: [
      { transformOrigin: 'center center', transform: 'scale3d(1, 1, 1)' },
      { transform: 'scale3d(1.1, 1.1, 1.1)', offset: 0.25 },
      { transform: 'scale3d(1, 1, 1)', offset: 0.5 },
      { transform: 'scale3d(1.1, 1.1, 1.1)', offset: 0.75 },
      { transform: 'scale3d(1, 1, 1)' },
    ],
    橡皮筋: [
      { transformOrigin: 'center center', transform: 'scale3d(1, 1, 1)' },
      { transform: 'scale3d(0.75, 1.25, 1)', offset: 0.4 },
      { transform: 'scale3d(1.15, 0.75, 1)', offset: 0.5 },
      { transform: 'scale3d(.95, 1.05, 1)', offset: 0.65 },
      { transform: 'scale3d(1.05, .95, 1)', offset: 0.75 },
      { transform: 'scale3d(1, 1, 1)' },
    ],
    震动: [
      { transformOrigin: 'center center', transform: 'translate3d(0,0,0)' },
      { transform: 'translate3d(-10px,0,0)', offset: 0.1 },
      { transform: 'translate3d(10px,0,0)', offset: 0.2 },
      { transform: 'translate3d(-10px,0,0)', offset: 0.3 },
      { transform: 'translate3d(10px,0,0)', offset: 0.4 },
      { transform: 'translate3d(-10px,0,0)', offset: 0.5 },
      { transform: 'translate3d(10px,0,0)', offset: 0.6 },
      { transform: 'translate3d(-10px,0,0)', offset: 0.7 },
      { transform: 'translate3d(10px,0,0)', offset: 0.8 },
      { transform: 'translate3d(-10px,0,0)', offset: 0.9 },
      { transform: 'translate3d(0,0,0)' },
    ],
    钟摆: [
      { transformOrigin: 'center center' },
      { transform: 'translate3d(-25%, 0, 0) rotate3d(0, 0, 1, -5deg)', offset: 0.15 },
      { transform: 'translate3d(20%, 0, 0) rotate3d(0, 0, 1, 3deg)', offset: 0.3 },
      { transform: 'translate3d(-15%, 0, 0) rotate3d(0, 0, 1, -3deg)', offset: 0.45 },
      { transform: 'translate3d(10%, 0, 0) rotate3d(0, 0, 1, 2deg)', offset: 0.6 },
      { transform: 'translate3d(-5%, 0, 0) rotate3d(0, 0, 1, -1deg)', offset: 0.75 },
    ],
    嘀嗒: [
      { transformOrigin: 'center center', transform: 'scale3d(1, 1, 1)' },
      { transform: 'scale3d(.9, .9, .9) rotate3d(0, 0, 1, -3deg)', offset: 0.1 },
      { transform: 'scale3d(.9, .9, .9) rotate3d(0, 0, 1, -3deg)', offset: 0.2 },
      { transform: 'scale3d(1.1, 1.1, 1.1) rotate3d(0, 0, 1, 3deg)', offset: 0.3 },
      { transform: 'scale3d(1.1, 1.1, 1.1) rotate3d(0, 0, 1, -3deg)', offset: 0.4 },
      { transform: 'scale3d(1.1, 1.1, 1.1) rotate3d(0, 0, 1, 3deg)', offset: 0.5 },
      { transform: 'scale3d(1.1, 1.1, 1.1) rotate3d(0, 0, 1, -3deg)', offset: 0.6 },
      { transform: 'scale3d(1.1, 1.1, 1.1) rotate3d(0, 0, 1, 3deg)', offset: 0.7 },
      { transform: 'scale3d(1.1, 1.1, 1.1) rotate3d(0, 0, 1, -3deg)', offset: 0.8 },
      { transform: 'scale3d(1.1, 1.1, 1.1) rotate3d(0, 0, 1, 3deg)', offset: 0.9 },
      { transform: 'scale3d(1, 1, 1)' },
    ],
    摇晃: [
      { transformOrigin: 'center center', transform: 'rotate3d(0, 0, 1, 0)' },
      { transform: 'rotate3d(0, 0, 1, 15deg)', offset: 0.2 },
      { transform: 'rotate3d(0, 0, 1, -10deg)', offset: 0.4 },
      { transform: 'rotate3d(0, 0, 1, 5deg)', offset: 0.6 },
      { transform: 'rotate3d(0, 0, 1, -5deg)', offset: 0.8 },
      { transform: 'rotate3d(0, 0, 1, 0)' },
    ],
    果冻: [
      { transformOrigin: 'center center' },
      { offset: 0.11 },
      { transform: 'skewX(-12.5deg) skewY(-12.5deg)', offset: 0.22 },
      { transform: 'skewX(6.25deg) skewY(6.25deg)', offset: 0.33 },
      { transform: 'skewX(-3.125deg) skewY(-3.125deg)', offset: 0.44 },
      { transform: 'skewX(1.5625deg) skewY(1.5625deg)', offset: 0.55 },
      { transform: 'skewX(-0.78125deg) skewY(-0.78125deg)', offset: 0.66 },
      { transform: 'skewX(0.390625deg) skewY(0.390625deg)', offset: 0.77 },
      { transform: 'skewX(-0.1953125deg) skewY(-0.1953125deg)', offset: 0.88 },
    ],
    旋转: [{ transformOrigin: 'center center', transform: 'rotate(-360deg)', offset: 0 }],
    反向旋转: [{ transformOrigin: 'center center', transform: 'rotate(360deg)', offset: 0 }],
    向上平移: [{ transformOrigin: 'left top' }, { transform: 'translateY(100%)', offset: 0.3 }],
    向下平移: [{ transformOrigin: 'left top' }, { transform: 'translateY(-100%)', offset: 0.3 }],
    向左平移: [{ transformOrigin: 'center bottom' }, { transform: 'translateX(100%)', offset: 0.3 }],
    向右平移: [{ transformOrigin: 'center bottom' }, { transform: 'translateX(-100%)', offset: 0.3 }],
  } as Record<string, Keyframe[]>,
  out: {
    消失: [{ opacity: 0, offset: 0.1 }, { opacity: 0, offset: 1 }],
    淡出: [{ opacity: 0, offset: 1 }],
    弹跳: [
      { transform: 'scale3d(.9, .9, .9)', offset: 0.2 },
      { transform: 'scale3d(1.2, 1.2, 1.2)', offset: 0.5 },
      { transform: 'scale3d(1.2, 1.2, 1.2)', offset: 0.55 },
      { opacity: 0, transform: 'scale3d(.3, .3, .3)' },
    ],
    缩小: [{ opacity: 0, transform: 'scale(0.3)', offset: 1 }],
    旋转: [{ transform: 'rotate(-360deg)' }, { opacity: 0 }],
    悬挂脱落: [
      { transformOrigin: 'left top' },
      { transform: 'rotate3d(0, 0, 1, 80deg)', offset: 0.2 },
      { transform: 'rotate3d(0, 0, 1, 60deg)', offset: 0.4 },
      { transform: 'rotate3d(0, 0, 1, 80deg)', offset: 0.6 },
      { transform: 'rotate3d(0, 0, 1, 60deg)', offset: 0.8 },
      { opacity: 0, transform: 'translate3d(0, 700px, 0)' },
    ],
    加速退出: [{ opacity: 0, transform: 'translate3d(100%, 0, 0) skewX(30deg)', offset: 1 }],
    转出: [{ opacity: 0, transform: 'translate3d(100%, 0, 0) rotate3d(0, 0, 1, 120deg)', offset: 1 }],
    向上淡出: [{ opacity: 0, transform: 'translate3d(0, -100%, 0)', offset: 1 }],
    向下淡出: [{ opacity: 0, transform: 'translate3d(0, 100%, 0)', offset: 1 }],
    向左淡出: [{ opacity: 0, transform: 'translate3d(-100%, 0, 0)', offset: 1 }],
    向右淡出: [{ opacity: 0, transform: 'translate3d(100%, 0, 0)', offset: 1 }],
    向上飞出: [{ opacity: 0, transform: 'translate3d(0, -2000px, 0)', offset: 1 }],
    向下飞出: [{ opacity: 0, transform: 'translate3d(0, 2000px, 0)', offset: 1 }],
    向左飞出: [{ opacity: 0, transform: 'translate3d(-2000px, 0, 0)', offset: 1 }],
    向右飞出: [{ opacity: 0, transform: 'translate3d(2000px, 0, 0)', offset: 1 }],
    向上弹跳: [
      { transform: 'translate3d(0, 0, 0)' },
      { transform: 'translate3d(0, -20px, 0)', offset: 0.2 },
      { transform: 'translate3d(0, 20px, 0)', offset: 0.4 },
      { transform: 'translate3d(0, 20px, 0)', offset: 0.45 },
      { opacity: 0, transform: 'translate3d(0, -2000px, 0)' },
    ],
    向下弹跳: [
      { transform: 'translate3d(0, 0, 0)' },
      { transform: 'translate3d(0, 20px, 0)', offset: 0.2 },
      { transform: 'translate3d(0, -20px, 0)', offset: 0.4 },
      { transform: 'translate3d(0, -20px, 0)', offset: 0.45 },
      { opacity: 0, transform: 'translate3d(0, 2000px, 0)' },
    ],
    向左弹跳: [
      { transform: 'translate3d(0, 0, 0)' },
      { transform: 'translate3d(-20px, 0, 0)', offset: 0.2 },
      { transform: 'translate3d(20px, 0, 0)', offset: 0.4 },
      { transform: 'translate3d(20px, 0, 0)', offset: 0.45 },
      { opacity: 0, transform: 'translate3d(-2000px, 0, 0)' },
    ],
    向右弹跳: [
      { transform: 'translate3d(0, 0, 0)' },
      { transform: 'translate3d(20px, 0, 0)', offset: 0.2 },
      { transform: 'translate3d(-20px, 0, 0)', offset: 0.4 },
      { transform: 'translate3d(-20px, 0, 0)', offset: 0.45 },
      { opacity: 0, transform: 'translate3d(2000px, 0, 0)' },
    ],
    右上旋出: [
      { transformOrigin: 'right bottom', transform: 'rotate3d(0, 0, 1, 0)' },
      { transformOrigin: 'right bottom', opacity: 0, transform: 'rotate3d(0, 0, 1, 90deg)' },
    ],
    左上旋出: [
      { transformOrigin: 'left bottom', transform: 'rotate3d(0, 0, 1, 0)' },
      { transformOrigin: 'left bottom', opacity: 0, transform: 'rotate3d(0, 0, 1, -90deg)' },
    ],
    左下旋出: [
      { transformOrigin: 'right bottom', transform: 'rotate3d(0, 0, 1, 0)' },
      { transformOrigin: 'right bottom', opacity: 0, transform: 'rotate3d(0, 0, 1, -90deg)' },
    ],
    右下旋出: [
      { transformOrigin: 'left bottom', transform: 'rotate3d(0, 0, 1, 0)' },
      { transformOrigin: 'left bottom', opacity: 0, transform: 'rotate3d(0, 0, 1, 90deg)' },
    ],
    向上缩小: [
      { transform: 'scale3d(1, 1, 1) translate3d(0, 0, 0)' },
      { transform: 'scale3d(.475, .475, .475) translate3d(0, 60px, 0)', offset: 0.4 },
      { opacity: 0, transform: 'scale3d(.1, .1, .1) translate3d(0, -2000px, 0)' },
    ],
    向下缩小: [
      { transform: 'scale3d(1, 1, 1) translate3d(0, 0, 0)' },
      { transform: 'scale3d(.475, .475, .475) translate3d(0, -60px, 0)', offset: 0.4 },
      { opacity: 0, transform: 'scale3d(.1, .1, .1) translate3d(0, 2000px, 0)' },
    ],
    向左缩小: [
      { transform: 'scale3d(1, 1, 1) translate3d(0, 0, 0)' },
      { transform: 'scale3d(.475, .475, .475) translate3d(42px, 0, 0)', offset: 0.4 },
      { opacity: 0, transform: 'scale3d(.1, .1, .1) translate3d(-2000px, 0, 0)' },
    ],
    向右缩小: [
      { transform: 'scale3d(1, 1, 1) translate3d(0, 0, 0)' },
      { transform: 'scale3d(.475, .475, .475) translate3d(-42px, 0, 0)', offset: 0.4 },
      { opacity: 0, transform: 'scale3d(.1, .1, .1) translate3d(2000px, 0, 0)' },
    ],
  } as Record<string, Keyframe[]>,
}

export function convertAnimation(
  el: Record<string, any>,
  animation: Record<string, any>,
  type: 'in' | 'stay' | 'out',
) {
  const {
    name,
    duration,
    iterations,
    mode,
    easing,
    path,
    offsetRotate,
    ...meta
  } = animation

  let keyframes: Keyframe[] | undefined
  if (name === '自定义路径' && path) {
    let d = `M ${el.style.width / 2} ${el.style.height / 2}`
    path.forEach((v: Record<string, any>) => {
      const keys = Object.keys(v)
      d += ` ${keys[0]}${v[keys[0]].join(' ')}`
    })
    const offsetPath = `path("${d}")`
    switch (type) {
      case 'in':
        keyframes = [
          { opacity: 0, offsetDistance: '100%', offsetPath, offsetRotate },
          { offsetDistance: '0%', offsetPath, offsetRotate },
        ]
        break
      case 'stay':
        keyframes = [
          { offsetDistance: '0%', offsetPath, offsetRotate },
          { offsetDistance: '100%', offsetPath, offsetRotate },
        ]
        break
      case 'out':
        keyframes = [
          { offsetDistance: '0%', offsetPath, offsetRotate },
          { opacity: 0, offsetDistance: '100%', offsetPath, offsetRotate },
        ]
        break
    }
  }
  else {
    switch (type) {
      case 'in':
        keyframes = animations.textIn[name]?.[0] ?? animations.in[name]
        break
      case 'stay':
        keyframes = animations.stay[name]
        break
      case 'out':
        keyframes = animations.out[name]
        break
    }
  }

  return {
    delay: 0,
    id: idGenerator(),
    name: animation.name ?? animation.title ?? animation.id,
    duration: name ? duration * (iterations || 1) : 0,
    effectMode: mode === '逐字' || mode === '逐行' ? 'sibling' : 'parent',
    keyframes: keyframes ?? [],
    easing: animations.easing[easing],
    meta: {
      ...meta,
      inCanvasIs: 'Animation',
      inPptIs: 'Animation',
      inEditorIs: 'Node',
    },
  }
}

// '[{"in":{"name":"放大","duration":600,"delay":0,"iterations":1,"easing":"匀速"},"stay":{"name":"无动画","duration":600,"delay":0,"iterations":1,"easing":"匀速"},"stayTime":600,"out":{"name":"一直显示","duration":600,"delay":0,"iterations":1,"easing":"匀速"}}]'
export function parseAnimations(
  el: Record<string, any>,
) {
  if (!el.animations?.length) {
    return {
      delay: 0,
      duration: 0,
      animations: [],
    }
  }

  let _animIn
  let _animStay
  let _animOut
  if (el.animations[0].in) {
    // v1
    _animIn = el.animations[0].in
    _animStay = el.animations[0].stay
    _animOut = el.animations[0].out
  }
  else {
    // v2
    _animIn = el.animations?.find((v: any) => v.category === 'in')
    _animStay = el.animations?.find((v: any) => v.category === 'stay')
    _animOut = el.animations?.find((v: any) => v.category === 'out')
  }

  const delay = _animIn?.delay ?? 0

  const animIn = _animIn
    ? convertAnimation(el, { ..._animIn, delay: 0 }, 'in')
    : undefined

  const animStay = _animStay
    ? convertAnimation(el, { ..._animStay, delay: _animStay.delay - delay }, 'stay')
    : undefined

  const animOut = _animOut
    ? convertAnimation(el, { ..._animOut, delay: _animOut.delay - delay }, 'out')
    : undefined

  const duration = animOut && !!animOut.keyframes
    ? animOut.delay - delay + animOut.duration
    : 0

  return {
    delay,
    duration,
    animations: [animIn, animStay, animOut].filter(Boolean).filter(v => !!v?.keyframes),
  }
}

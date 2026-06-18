import type { LottieCompositionInput } from './lottie'
import { describe, expect, it } from 'vitest'
import { buildLottie } from './lottie'

function comp(overrides: Partial<LottieCompositionInput> = {}): LottieCompositionInput {
  return {
    width: 800,
    height: 600,
    fps: 30,
    durationMs: 2000,
    layers: [],
    ...overrides,
  }
}

describe('buildLottie', () => {
  it('合成头部字段正确（fr / op / w / h）', () => {
    const j = buildLottie(comp()) as any
    expect(j.v).toBeDefined()
    expect(j.fr).toBe(30)
    expect(j.op).toBe(60) // 2000ms * 30fps / 1000
    expect(j.w).toBe(800)
    expect(j.h).toBe(600)
    expect(Array.isArray(j.layers)).toBe(true)
  })

  it('单关键帧 → 静态通道（a:0）', () => {
    const j = buildLottie(comp({
      layers: [{
        width: 100,
        height: 100,
        keyframes: [{ offset: 0, opacity: 0.5 }],
      }],
    })) as any
    expect(j.layers[0].ks.o).toEqual({ a: 0, k: [50] })
  })

  it('多关键帧 → 动画通道（a:1），帧号按 offset*op，含贝塞尔手柄', () => {
    const j = buildLottie(comp({
      layers: [{
        width: 100,
        height: 100,
        keyframes: [
          { offset: 0, easing: 'ease-in', left: 0, top: 0, opacity: 0 },
          { offset: 1, left: 100, top: 50, opacity: 1 },
        ],
      }],
    })) as any
    const p = j.layers[0].ks.p
    expect(p.a).toBe(1)
    expect(p.k[0].t).toBe(0)
    expect(p.k[0].s).toEqual([0, 0, 0])
    expect(p.k[1].t).toBe(60)
    expect(p.k[1].s).toEqual([100, 50, 0])
    // ease-in = cubic-bezier(0.42,0,1,1) → o={x:[0.42],y:[0]}
    expect(p.k[0].o).toEqual({ x: [0.42], y: [0] })
    // opacity 通道也动画化
    expect(j.layers[0].ks.o.a).toBe(1)
  })

  it('未动画通道用 base 回退（静态）', () => {
    const j = buildLottie(comp({
      layers: [{
        width: 100,
        height: 100,
        base: { rotate: 45 },
        keyframes: [
          { offset: 0, opacity: 0 },
          { offset: 1, opacity: 1 },
        ],
      }],
    })) as any
    expect(j.layers[0].ks.r).toEqual({ a: 0, k: [45] })
  })
})

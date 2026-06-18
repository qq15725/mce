import { describe, expect, it } from 'vitest'
import { cubicBezierEasing, evalEasing, parseEasing } from './easing'

describe('parseEasing', () => {
  it('命名预设 / cubic-bezier 字符串 / 自定义注册表', () => {
    expect(parseEasing('linear')).toEqual([0, 0, 1, 1])
    expect(parseEasing('cubic-bezier(0.1, 0.2, 0.3, 0.4)')).toEqual([0.1, 0.2, 0.3, 0.4])
    expect(parseEasing('myBounce', { myBounce: 'cubic-bezier(0.5, 0, 0.5, 1)' })).toEqual([0.5, 0, 0.5, 1])
    expect(parseEasing('myAlias', { myAlias: 'ease-in' })).toEqual([0.42, 0, 1, 1])
  })

  it('无法解析回退 linear', () => {
    expect(parseEasing('garbage')).toEqual([0, 0, 1, 1])
    expect(parseEasing(undefined)).toEqual([0, 0, 1, 1])
  })
})

describe('cubicBezierEasing / evalEasing', () => {
  it('边界恒为 0 和 1', () => {
    const f = cubicBezierEasing([0.42, 0, 0.58, 1])
    expect(f(0)).toBe(0)
    expect(f(1)).toBe(1)
  })

  it('linear 是恒等', () => {
    expect(evalEasing('linear', 0.3)).toBeCloseTo(0.3, 5)
    expect(evalEasing('linear', 0.75)).toBeCloseTo(0.75, 5)
  })

  it('ease-in 起步慢（y < x），ease-out 起步快（y > x）', () => {
    expect(evalEasing('ease-in', 0.3)).toBeLessThan(0.3)
    expect(evalEasing('ease-out', 0.3)).toBeGreaterThan(0.3)
  })

  it('单调递增', () => {
    const f = cubicBezierEasing([0.42, 0, 0.58, 1])
    let prev = -1
    for (let x = 0; x <= 1.0001; x += 0.1) {
      const y = f(Math.min(x, 1))
      expect(y).toBeGreaterThanOrEqual(prev)
      prev = y
    }
  })
})

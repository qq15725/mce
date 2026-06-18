import type { Keyframe } from './keyframes'
import { describe, expect, it } from 'vitest'
import { removeKeyframeAt, sampleKeyframes, setKeyframeEasing, sortKeyframes, upsertKeyframe } from './keyframes'

const kfs: Keyframe[] = [
  { offset: 0, props: { left: 0, opacity: 0 } },
  { offset: 1, props: { left: 100, opacity: 1 } },
]

describe('cRUD', () => {
  it('upsert 插入并按 offset 排序', () => {
    const r = upsertKeyframe(kfs, { offset: 0.5, props: { left: 40 } })
    expect(r.map(k => k.offset)).toEqual([0, 0.5, 1])
  })

  it('upsert 同 offset 合并 props', () => {
    const r = upsertKeyframe(kfs, { offset: 0, props: { rotation: 90 } })
    expect(r[0].props).toEqual({ left: 0, opacity: 0, rotation: 90 })
  })

  it('remove / setEasing 不改输入', () => {
    const snapshot = JSON.stringify(kfs)
    expect(removeKeyframeAt(kfs, 0).map(k => k.offset)).toEqual([1])
    expect(setKeyframeEasing(kfs, 0, 'ease-in')[0].easing).toBe('ease-in')
    expect(JSON.stringify(kfs)).toBe(snapshot)
  })

  it('sortKeyframes', () => {
    expect(sortKeyframes([{ offset: 1, props: {} }, { offset: 0, props: {} }]).map(k => k.offset)).toEqual([0, 1])
  })
})

describe('sampleKeyframes', () => {
  it('线性插值数值属性', () => {
    const r = sampleKeyframes(kfs, 0.5)
    expect(r.left).toBeCloseTo(50, 5)
    expect(r.opacity).toBeCloseTo(0.5, 5)
  })

  it('段缓动取左关键帧 easing（ease-in 起步慢）', () => {
    const eased = setKeyframeEasing(kfs, 0, 'ease-in')
    expect(sampleKeyframes(eased, 0.3).left).toBeLessThan(30)
  })

  it('边界外取端点值', () => {
    expect(sampleKeyframes(kfs, 0).left).toBe(0)
    expect(sampleKeyframes(kfs, 1).left).toBe(100)
    expect(sampleKeyframes(kfs, 2).left).toBe(100)
  })

  it('多段：落在正确区间内插值', () => {
    const three = upsertKeyframe(kfs, { offset: 0.5, props: { left: 40, opacity: 0.5 } })
    expect(sampleKeyframes(three, 0.75).left).toBeCloseTo(70, 5) // 40→100 的中点
  })

  it('非数值属性用阶梯（取左值直到终点）', () => {
    const colorKfs: Keyframe[] = [
      { offset: 0, props: { fill: '#000' } },
      { offset: 1, props: { fill: '#fff' } },
    ]
    expect(sampleKeyframes(colorKfs, 0.4).fill).toBe('#000')
    expect(sampleKeyframes(colorKfs, 1).fill).toBe('#fff')
  })
})

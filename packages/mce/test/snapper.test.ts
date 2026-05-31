import { describe, expect, it } from 'vitest'
import { closestLine } from '../src/mixins/snapper'

describe('closestLine', () => {
  it('returns undefined for empty input', () => {
    expect(closestLine(new Set<number>(), 100, 5)).toBeUndefined()
    expect(closestLine([], 100, 5)).toBeUndefined()
  })

  it('returns the closest line within threshold', () => {
    expect(closestLine(new Set([100, 200, 300]), 102, 5)).toBe(100)
    expect(closestLine(new Set([100, 200, 300]), 198, 5)).toBe(200)
    expect(closestLine(new Set([100, 200, 300]), 300, 5)).toBe(300)
  })

  it('returns undefined when nearest exceeds threshold', () => {
    expect(closestLine(new Set([100, 200]), 150, 5)).toBeUndefined()
    expect(closestLine(new Set([100]), 110, 5)).toBeUndefined()
  })

  it('exact match returns the line', () => {
    expect(closestLine(new Set([100]), 100, 5)).toBe(100)
  })

  it('threshold is strict (<, not <=)', () => {
    // distance exactly == threshold should NOT match
    expect(closestLine(new Set([105]), 100, 5)).toBeUndefined()
    expect(closestLine(new Set([104.999]), 100, 5)).toBe(104.999)
  })

  it('handles negative positions / lines', () => {
    expect(closestLine(new Set([-100, 0, 100]), -98, 5)).toBe(-100)
  })

  it('accepts arrays as Iterable input', () => {
    expect(closestLine([100, 200], 198, 5)).toBe(200)
  })
})

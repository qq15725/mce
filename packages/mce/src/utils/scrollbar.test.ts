import { describe, expect, it } from 'vitest'
import {
  createScrollbarDrag,
  measureScrollbarDrag,
  scrollbarPositionFromDrag,
} from './scrollbar'

describe('scrollbar drag', () => {
  it('拖到轨道边缘时保持有限坐标', () => {
    const drag = createScrollbarDrag(-300, 600, 1200)

    expect(scrollbarPositionFromDrag(-10_000, drag)).toBe(drag.scrollStart)
    expect(scrollbarPositionFromDrag(10_000, drag)).toBe(drag.scrollStart + drag.scrollRange)
    expect(Number.isFinite(scrollbarPositionFromDrag(-10_000, drag))).toBe(true)
    expect(Number.isFinite(scrollbarPositionFromDrag(10_000, drag))).toBe(true)
  })

  it('拖动期间使用固定区间保持滑块跟手', () => {
    const drag = createScrollbarDrag(-300, 600, 1200)
    const offset = drag.thumbTravel / 4
    const position = scrollbarPositionFromDrag(offset, drag)
    const measure = measureScrollbarDrag(position, drag)

    expect(measure.position).toBeCloseTo(drag.position + 0.25)
    expect(measure.length).toBe(drag.length)
  })
})

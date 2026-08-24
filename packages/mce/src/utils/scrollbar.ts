export interface ScrollbarMeasure {
  scrollRange: number
  length: number
  position: number
}

export interface ScrollbarDragState extends ScrollbarMeasure {
  scrollStart: number
  thumbOffset: number
  thumbTravel: number
}

export function measureScrollbar(position: number, contentLength: number, viewLength: number): ScrollbarMeasure {
  const scrollStart = Math.min(0, position) - viewLength / 2
  const scrollEnd = Math.max(contentLength, position + viewLength) + viewLength / 2
  const scrollLength = scrollEnd - scrollStart
  const scrollRange = scrollLength - viewLength
  return {
    scrollRange,
    length: scrollLength > 0
      ? Math.max(0.05, Math.min(1, viewLength / scrollLength))
      : 1,
    position: scrollRange > 0
      ? Math.min(1, Math.max(0, (position - scrollStart) / scrollRange))
      : 0,
  }
}

export function createScrollbarDrag(position: number, contentLength: number, viewLength: number): ScrollbarDragState {
  const measure = measureScrollbar(position, contentLength, viewLength)
  const thumbTravel = viewLength * (1 - measure.length)
  return {
    ...measure,
    scrollStart: position - measure.position * measure.scrollRange,
    thumbOffset: measure.position * thumbTravel,
    thumbTravel,
  }
}

export function measureScrollbarDrag(position: number, drag: ScrollbarDragState): ScrollbarMeasure {
  return {
    scrollRange: drag.scrollRange,
    length: drag.length,
    position: drag.scrollRange > 0
      ? Math.min(1, Math.max(0, (position - drag.scrollStart) / drag.scrollRange))
      : 0,
  }
}

export function scrollbarPositionFromDrag(offset: number, drag: ScrollbarDragState): number {
  if (drag.thumbTravel <= 0 || drag.scrollRange <= 0)
    return drag.scrollStart

  const thumbOffset = Math.min(drag.thumbTravel, Math.max(0, drag.thumbOffset + offset))
  return drag.scrollStart + thumbOffset / drag.thumbTravel * drag.scrollRange
}

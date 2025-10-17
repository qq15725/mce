import type { Element2D, PointerInputEvent } from 'modern-canvas'
import type { PropType } from 'vue'
import { propsFactory } from '../utils/propsFactory'

export interface ActiveStrategyContext {
  element: Element2D | undefined
  oldElement: Element2D | undefined
  event: PointerInputEvent
  isExcluded: (element: Element2D) => boolean
}

export interface HoverStrategyContext extends ActiveStrategyContext {
  //
}

export type ResizeStrategy = (element: Element2D) =>
  | 'free' | 'aspectRatio' | 'diagonalAspectRatio'

export type ActiveStrategy = (context: ActiveStrategyContext) =>
  | {
    element: Element2D | undefined
    state: Mce.State | undefined
  }
  | Element2D
  | undefined

export type HoverStrategy = (context: HoverStrategyContext) =>
  | {
    element: Element2D | undefined
    cursor: string | undefined
  }
  | Element2D
  | undefined

export const makeMceStrategyProps = propsFactory({
  resizeStrategy: Function as PropType<ResizeStrategy>,
  activeStrategy: Function as PropType<ActiveStrategy>,
  hoverStrategy: Function as PropType<HoverStrategy>,
}, 'makeMceStrategyProps')

export const defaultResizeStrategy: ResizeStrategy = (element) => {
  switch (element.meta?.inPptIs) {
    case 'Picture':
      return 'diagonalAspectRatio'
  }

  if (element.foreground.canDraw()) {
    return 'diagonalAspectRatio'
  }

  return 'free'
}

export const defaultActiveStrategy: ActiveStrategy = (context) => {
  const { element, oldElement, isExcluded } = context
  if (element && !isExcluded(element)) {
    if (element.equal(oldElement)) {
      if (element.text.canDraw()) {
        return {
          element,
          state: 'typing' as const,
        }
      }
    }
    return element
  }
  return undefined
}

export const defaultHoverStrategy: HoverStrategy = (context) => {
  const { element, isExcluded, oldElement } = context
  if (element && !isExcluded(element)) {
    if (element.equal(oldElement)) {
      return {
        element,
        cursor: 'move' as const,
      }
    }
    return element
  }
  return undefined
}

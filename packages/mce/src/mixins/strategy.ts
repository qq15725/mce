import type {
  ActiveStrategy,
  DoubleclickStrategy,
  HoverStrategy,
  ResizeStrategy,
} from '../composables/strategy'
import {
  defaultActiveStrategy,
  defaultDoubleclickStrategy,
  defaultHoverStrategy,
} from '../composables/strategy'
import { defineMixin } from '../mixin'

declare global {
  namespace Mce {
    interface Editor {
      activeStrategy: ActiveStrategy
      doubleclickStrategy: DoubleclickStrategy
      hoverStrategy: HoverStrategy
      resizeStrategy?: ResizeStrategy
    }

    interface Options {
      activeStrategy?: ActiveStrategy
      doubleclickStrategy?: DoubleclickStrategy
      hoverStrategy?: HoverStrategy
      resizeStrategy?: ResizeStrategy
    }
  }
}

// Interaction strategies are configurable at editor creation, e.g.
// `new Editor({ activeStrategy, hoverStrategy })`. EditorLayout props still take
// precedence when provided, so per-mount overrides remain possible.
export default defineMixin((_editor, options) => {
  return {
    activeStrategy: options.activeStrategy ?? defaultActiveStrategy,
    doubleclickStrategy: options.doubleclickStrategy ?? defaultDoubleclickStrategy,
    hoverStrategy: options.hoverStrategy ?? defaultHoverStrategy,
    resizeStrategy: options.resizeStrategy,
  }
})

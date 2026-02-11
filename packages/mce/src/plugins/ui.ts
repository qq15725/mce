import type { PointerInputEvent } from 'modern-canvas'
import { definePlugin } from '../plugin'

declare global {
  namespace Mce {
    interface PointerDownOptions {
      allowTopFrame?: boolean
    }

    interface Commands {
      pointerDown: (e: PointerInputEvent, options?: PointerDownOptions) => void
    }
  }
}

export default definePlugin(() => {
  return {
    name: 'mce:ui',
  }
})

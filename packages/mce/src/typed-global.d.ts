import type { Vector2Like } from 'modern-canvas'
import 'modern-canvas'

declare module 'modern-canvas' {
  interface Meta {
    inPptIs?: 'Pptx' | 'Picture' | 'Shape' | 'GroupShape' | 'Animation'
    inEditorIs?: 'Doc' | 'Frame' | 'Element' | 'Node'
    inCanvasIs?: 'Lottie2D' | 'Element2D' | 'Animation'
    lock?: boolean
    lockAspectRatio?: boolean
    movable?: boolean
    rotatable?: boolean
    resizable?: boolean
    transformable?: boolean
  }
}

declare global {
  namespace Mce {
    interface Editor {}
    interface Options {}
    interface Slots {}
    interface Events {
      ready: []
    }
    interface Hotkeys {}
    interface Commands {}
    interface Exporters {}
    interface Config {}

    type State
      = | 'loading'
        | 'hand'
        | 'drawing'
        | 'selecting'
        | 'moving'
        | 'transforming'
        | 'typing'
        | 'cropping'
        | 'imageReplacing'
        | 'shapeReplacing'
        | 'painting'
        | undefined

    interface DrawingContext {
      tip?: string
      start?: (position: Vector2Like) => void
      move?: (position: Vector2Like) => void
      end?: (position: Vector2Like) => void
    }
  }
}

export {}

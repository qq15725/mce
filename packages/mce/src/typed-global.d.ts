import type { Vector2Data } from 'modern-canvas'
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
    interface Events {
      ready: []
    }
    interface Hotkeys {}
    interface Commands {}
    interface Exporters {}
    interface Config {}

    type State
      = | 'loading'
        | 'grab'
        | 'grabbing'
        | 'drawing'
        | 'selecting'
        | 'transforming'
        | 'typing'
        | 'cropping'
        | 'imageReplacing'
        | 'shapeReplacing'
        | undefined

    interface DrawingContext {
      tip?: string
      start?: (position: Vector2Data) => void
      move?: (position: Vector2Data) => void
      end?: (position: Vector2Data) => void
    }
  }
}

export {}

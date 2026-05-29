import type { Vector2Like } from 'modern-canvas'
import type { DeepMaybe } from './types'
import 'modern-canvas'

declare module 'modern-canvas' {
  interface Meta {
    inPptIs?: 'Pptx' | 'Picture' | 'Shape' | 'GroupShape' | 'Animation'
    inEditorIs?: 'Doc' | 'Frame' | 'Element' | 'Node' | `Workflow${string}`
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
    interface Slots {}
    interface Events {
      ready: []
    }
    interface Hotkeys {}
    interface Commands {}
    interface Exporters {}
    interface Config {}
    interface Options extends DeepMaybe<Config> {
      /** 编辑器初始模式，默认 'canvas'。见 {@link Mode}。 */
      mode?: Mode
    }

    // Persistent editor mode, orthogonal to the transient `State`. 'canvas' is
    // the free-form editing experience; 'workflow' turns the canvas into a
    // node-graph editor (directional connections, port handles).
    type Mode = 'canvas' | 'workflow'

    type State
      = | 'loading'
        | 'hand'
        | 'drawing'
        | 'selecting'
        | 'moving'
        | 'transforming'
        | 'typing'
        | 'tableEditing'
        | 'cropping'
        | 'pathEditing'
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

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
    // 'canvas' 为核心自由编辑模式；插件可贡献其它模式（如 @mce/workflow 的 'workflow'），
    // 故联合保留 `(string & {})` 以接纳任意字符串而不丢核心字面量补全。
    type Mode = 'canvas' | (string & {})

    // 插件可贡献自己的瞬时编辑态（如 @mce/table 的 'tableEditing'），故联合里保留
    // `(string & {})` 以接纳任意字符串而不丢核心字面量的自动补全。
    type State
      = | 'loading'
        | 'hand'
        | 'drawing'
        | 'selecting'
        | 'moving'
        | 'transforming'
        | 'typing'
        | 'cropping'
        | 'pathEditing'
        | 'imageReplacing'
        | 'shapeReplacing'
        | 'painting'
        | (string & {})
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

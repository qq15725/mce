import 'modern-canvas'

declare module 'modern-canvas' {
  interface Meta {
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
        | 'drawing'
        | 'selecting'
        | 'transforming'
        | 'typing'
        | 'cropping'
        | 'imageReplacing'
        | 'shapeReplacing'
        | undefined

    type StateContext = Record<string, any>
  }
}

export {}

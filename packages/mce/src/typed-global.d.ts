declare global {
  namespace Mce {
    interface Editor {}
    interface Options {}
    interface Events {}
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

declare global {
  namespace Mce {
    type Status
      = | 'loading'
        | 'drawing'
        | 'selecting'
        | 'transforming'
        | 'typing'
        | 'cropping'
        | 'imageReplacing'
        | 'shapeReplacing'
        | undefined

    type StatusContext = Record<string, any>

    interface Editor {}
    interface Events {}
    interface Hotkeys {}
    interface Commands {}
    interface Exporters {}
    interface Config {
      version: string
    }
  }
}

export {}

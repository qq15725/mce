import { definePlugin } from '../plugin'

declare global {
  namespace Mce {
    type View = keyof UIConfig

    interface Commands {
      getView: <T extends View>(view: T) => UIConfig[T]
      enableView: (view: View, enabled?: boolean) => void
      isViewEnabled: (view: View) => boolean
      toggleView: (view: View) => void
      hideView: (view: View) => void
      showView: (view: View) => void
    }
  }
}

export default definePlugin((editor) => {
  const {
    config,
  } = editor

  const getView: Mce.Commands['getView'] = (view) => {
    return config.value.ui[view]
  }

  const enableView: Mce.Commands['enableView'] = (view, enabled) => {
    const obj = getView(view)
    if (obj && 'enabled' in obj) {
      if (enabled === undefined) {
        obj.enabled = !obj.enabled
      }
      else {
        obj.enabled = enabled
      }
    }
  }

  return {
    name: 'mce:view',
    commands: [
      { command: 'getView', handle: getView },
      { command: 'enableView', handle: enableView },
      { command: 'isViewEnabled', handle: view => Boolean(getView(view).enabled) },
      { command: 'toggleView', handle: view => enableView(view) },
      { command: 'hideView', handle: view => enableView(view, false) },
      { command: 'showView', handle: view => enableView(view, true) },
    ],
    hotkeys: [
      { command: 'toggleView:pixelGrid', key: 'Shift+"' },
      { command: 'toggleView:ruler', key: 'Shift+R' },
    ],
  }
})

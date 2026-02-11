import { definePlugin } from '../plugin'

declare global {
  namespace Mce {
    type View = keyof UIConfig

    interface Commands {
      getView: <T extends View>(view: T) => UIConfig[T]
      setViewEnabled: (view: View, enabled?: boolean) => void
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

  const setViewEnabled: Mce.Commands['setViewEnabled'] = (view, enabled) => {
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
      { command: 'setViewEnabled', handle: setViewEnabled },
      { command: 'isViewEnabled', handle: view => Boolean(getView(view).enabled) },
      { command: 'toggleView', handle: view => setViewEnabled(view) },
      { command: 'hideView', handle: view => setViewEnabled(view, false) },
      { command: 'showView', handle: view => setViewEnabled(view, true) },
    ],
    hotkeys: [
      { command: 'toggleView:pixelGrid', key: 'Shift+"' },
      { command: 'toggleView:ruler', key: 'Shift+R' },
    ],
  }
})

import type { PointerInputEvent } from 'modern-canvas'
import { definePlugin } from '../plugin'

declare global {
  namespace Mce {
    type Ui = keyof UIConfig

    interface PointerDownOptions {
      allowTopFrame?: boolean
    }

    interface Commands {
      getUiConfig: <T extends Ui>(name: T) => UIConfig[T]
      setUiVisible: (name: Ui, visible: boolean | 'toggle') => void
      isUiVisible: (name: Ui) => boolean
      hideUi: (name: Ui) => void
      showUi: (name: Ui) => void
      toggleUi: (name: Ui) => void
      isPanelVisible: (name: string) => boolean
      setPanelVisible: (name: string, visible: boolean | 'toggle') => void
      hidePanel: (name: string, visible: boolean | 'toggle') => void
      showPanel: (name: string, visible: boolean | 'toggle') => void
      togglePanel: (name: string, visible: boolean | 'toggle') => void
      pointerDown: (e: PointerInputEvent, options?: PointerDownOptions) => void
    }
  }
}

export default definePlugin((editor) => {
  const {
    config,
    components,
  } = editor

  const getUiConfig: Mce.Commands['getUiConfig'] = (name) => {
    return config.value.ui[name]
  }

  const setUiVisible: Mce.Commands['setUiVisible'] = (name, visible) => {
    const obj = getUiConfig(name)
    if (obj && 'visible' in obj) {
      if (visible === 'toggle') {
        obj.visible = !obj.visible
      }
      else {
        obj.visible = visible
      }
    }
  }

  const isPanelVisible: Mce.Commands['isPanelVisible'] = (name) => {
    return Boolean(components.value.find(c => c.type === 'panel' && c.name === name)?.visible.value)
  }

  const setPanelVisible: Mce.Commands['setPanelVisible'] = (name, visible) => {
    const c = components.value.find(c => c.type === 'panel' && c.name === name)
    if (c) {
      if (visible === 'toggle') {
        c.visible.value = !c.visible.value
      }
      else {
        c.visible.value = visible
      }
    }
  }

  return {
    name: 'mce:view',
    commands: [
      { command: 'getUiConfig', handle: getUiConfig },
      { command: 'isUiVisible', handle: name => Boolean(getUiConfig(name).visible) },
      { command: 'setUiVisible', handle: setUiVisible },
      { command: 'hideUi', handle: name => setUiVisible(name, false) },
      { command: 'showUi', handle: name => setUiVisible(name, true) },
      { command: 'toggleUi', handle: name => setUiVisible(name, 'toggle') },
      { command: 'isPanelVisible', handle: isPanelVisible },
      { command: 'setPanelVisible', handle: setPanelVisible },
      { command: 'hidePanel', handle: name => setPanelVisible(name, false) },
      { command: 'showPanel', handle: name => setPanelVisible(name, true) },
      { command: 'togglePanel', handle: name => setPanelVisible(name, 'toggle') },
    ],
    hotkeys: [
      { command: 'toggleUi:pixelGrid', key: 'Shift+"' },
      { command: 'toggleUi:ruler', key: 'Shift+R' },
    ],
  }
})

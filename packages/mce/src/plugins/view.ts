import { definePlugin } from '../plugin'

declare global {
  namespace Mce {
    type View = keyof UIConfig

    interface Commands {
      view: <T extends View>(view: T) => Promise<boolean>
    }
  }
}

export default definePlugin((editor) => {
  const {
    config,
  } = editor

  return {
    name: 'mce:view',
    commands: [
      {
        command: 'view',
        handle: (view: Mce.View) => {
          const obj = config.value.ui[view]
          if (obj && 'enabled' in obj) {
            obj.enabled = !obj.enabled
          }
        },
      },
    ],
    hotkeys: [
      { command: 'view:pixelGrid', key: 'Shift+"' },
      { command: 'view:ruler', key: 'Shift+R' },
    ],
  }
})
